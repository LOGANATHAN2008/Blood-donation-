require('dotenv').config();
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const Hospital = require('../src/models/Hospital');
const DISTRICTS = [
  'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore', 'Dharmapuri', 'Dindigul', 'Erode',
  'Kallakurichi', 'Kanchipuram', 'Kanyakumari', 'Karur', 'Krishnagiri', 'Madurai', 'Mayiladuthurai', 'Nagapattinam',
  'Namakkal', 'Nilgiris', 'Perambalur', 'Pudukkottai', 'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga', 'Tenkasi',
  'Thanjavur', 'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli', 'Tirupathur', 'Tiruppur', 'Tiruvallur',
  'Tiruvannamalai', 'Tiruvarur', 'Vellore', 'Viluppuram', 'Virudhunagar'
];
const CSV_PATH = path.join(__dirname, '../data/blood_banks.csv');

// Simple Levenshtein distance for fuzzy matching districts
function levenshtein(a, b) {
  const m = [];
  for (let i = 0; i <= b.length; i++) m[i] = [i];
  for (let j = 0; j <= a.length; j++) m[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      m[i][j] = b.charAt(i - 1) === a.charAt(j - 1) 
        ? m[i - 1][j - 1] 
        : Math.min(m[i - 1][j - 1] + 1, Math.min(m[i][j - 1] + 1, m[i - 1][j] + 1));
    }
  }
  return m[b.length][a.length];
}

function matchDistrict(input) {
  if (!input) return null;
  const clean = input.trim().toLowerCase().replace(/ district$/i, '');
  let best = null;
  let minDistance = Infinity;

  for (const d of DISTRICTS) {
    const target = d.toLowerCase();
    if (target === clean || target.startsWith(clean) || clean.startsWith(target)) {
      return d;
    }
    const dist = levenshtein(clean, target);
    if (dist < minDistance) {
      minDistance = dist;
      best = d;
    }
  }
  return minDistance <= 3 ? best : null;
}

function toTitleCase(str) {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

async function run() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`CSV file not found at ${CSV_PATH}. Please download it from data.gov.in (Blood Bank Directory).`);
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  let inserted = 0, updated = 0, skipped = 0, unmatched = 0;
  const unmappedColumns = new Set();

  const rows = [];
  fs.createReadStream(CSV_PATH)
    .pipe(csv({
      mapHeaders: ({ header }) => {
        const h = header.trim().toLowerCase();
        if (h.includes('name')) return 'name';
        if (h.includes('address')) return 'address';
        if (h.includes('city')) return 'city';
        if (h.includes('district')) return 'district';
        if (h.includes('state')) return 'state';
        if (h.includes('pin') || h.includes('zip')) return 'pincode';
        if (h.includes('phone') || h.includes('contact')) return 'phone';
        if (h.includes('email')) return 'email';
        if (h.includes('lat')) return 'latitude';
        if (h.includes('lon') || h.includes('lng')) return 'longitude';
        if (h.includes('category') || h.includes('type')) return 'category';
        
        unmappedColumns.add(header);
        return header; // keep original if unmapped
      }
    }))
    .on('data', (row) => rows.push(row))
    .on('end', async () => {
      for (const row of rows) {
        const stateName = (row.state || 'Tamil Nadu').trim();
        let dName = matchDistrict(row.district || row.city) || (row.district || row.city || 'Chennai').trim();

        const cleanPhone = (row.phone || '').replace(/[^\d+]/g, '');
        if (!cleanPhone || cleanPhone.length < 7) {
          continue;
        }

        const lat = parseFloat(row.latitude);
        const lng = parseFloat(row.longitude);
        let isValidCoord = false;
        if (!isNaN(lat) && !isNaN(lng) && lat >= 6 && lat <= 38 && lng >= 68 && lng <= 98) {
          isValidCoord = true;
        }

        const dedupeKey = `${(row.name || '').toLowerCase()}_${(row.pincode || '').trim()}`;
        
        const is24x7 = true;

        const hospitalData = {
          uid: 'system',
          name: toTitleCase((row.name || '').trim()),
          type: 'Blood Bank',
          state: stateName,
          district: dName,
          address: (row.address || '').trim() + (row.city ? `, ${row.city}` : '') + (row.pincode ? ` - ${row.pincode}` : ''),
          phone: cleanPhone,
          lat: isValidCoord ? lat : null,
          lng: isValidCoord ? lng : null,
          location: isValidCoord ? { type: 'Point', coordinates: [lng, lat] } : undefined,
          is24x7: !!is24x7,
          status: 'Approved',
          verified: true,
          source: 'data.gov.in',
          sourceId: dedupeKey,
          importedAt: new Date(),
          lastVerifiedAt: new Date()
        };

        try {
          const existing = await Hospital.findOne({ sourceId: dedupeKey });
          if (existing) {
            await Hospital.updateOne({ _id: existing._id }, hospitalData);
            updated++;
          } else {
            await Hospital.create(hospitalData);
            inserted++;
          }
        } catch (err) {
          console.error(`Error saving ${row.name}:`, err.message);
          skipped++;
        }
      }

      console.log(`\nImport Summary:`);
      console.log(`Inserted: ${inserted}`);
      console.log(`Updated: ${updated}`);
      console.log(`Skipped (errors): ${skipped}`);
      console.log(`Unmatched Districts: ${unmatched}`);
      if (unmappedColumns.size > 0) {
        console.log(`Unmapped Columns: ${Array.from(unmappedColumns).join(', ')}`);
      }
      process.exit(0);
    });
}

run().catch(console.error);
