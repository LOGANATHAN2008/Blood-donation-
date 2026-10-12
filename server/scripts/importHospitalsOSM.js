require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');
const Hospital = require('../src/models/Hospital');
const { DISTRICTS } = require('../src/utils/validators');

// A minimal map of TN district coordinates for fallback nearest-district matching
// Format: { name: [lng, lat] }
const DISTRICT_CENTROIDS = {
  'Ariyalur': [79.0747, 11.1401], 'Chengalpattu': [79.9833, 12.6833], 'Chennai': [80.2707, 13.0827],
  'Coimbatore': [76.9558, 11.0168], 'Cuddalore': [79.7644, 11.7480], 'Dharmapuri': [78.1636, 12.1277],
  'Dindigul': [77.9803, 10.3673], 'Erode': [77.7172, 11.3410], 'Kallakurichi': [78.9667, 11.7333],
  'Kanchipuram': [79.7036, 12.8185], 'Kanyakumari': [77.5385, 8.0883], 'Karur': [78.0766, 10.9504],
  'Krishnagiri': [78.2206, 12.5273], 'Madurai': [78.1198, 9.9252], 'Mayiladuthurai': [79.6548, 11.1085],
  'Nagapattinam': [79.8433, 10.7672], 'Namakkal': [78.1652, 11.2189], 'Nilgiris': [76.7321, 11.4118],
  'Perambalur': [78.8821, 11.2333], 'Pudukkottai': [78.8242, 10.3797], 'Ramanathapuram': [78.8368, 9.3639],
  'Ranipet': [79.3333, 12.9333], 'Salem': [78.1460, 11.6643], 'Sivaganga': [78.4809, 9.8433],
  'Tenkasi': [77.3167, 8.9667], 'Thanjavur': [79.1378, 10.7870], 'Theni': [77.4768, 10.0104],
  'Thoothukudi': [78.1453, 8.7642], 'Tiruchirappalli': [78.7047, 10.7905], 'Tirunelveli': [77.7363, 8.7139],
  'Tirupathur': [78.5667, 12.4933], 'Tiruppur': [77.3411, 11.1085], 'Tiruvallur': [79.9120, 13.1417],
  'Tiruvannamalai': [79.0747, 12.2253], 'Tiruvarur': [79.6344, 10.7661], 'Vellore': [79.1325, 12.9165],
  'Viluppuram': [79.4861, 11.9401], 'Virudhunagar': [77.9548, 9.5872]
};

// Haversine distance in km
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function findNearestDistrict(lng, lat) {
  let nearest = 'Chennai';
  let minD = Infinity;
  for (const [d, coords] of Object.entries(DISTRICT_CENTROIDS)) {
    const dist = getDistance(lat, lng, coords[1], coords[0]);
    if (dist < minD) {
      minD = dist;
      nearest = d;
    }
  }
  return nearest;
}

const OVERPASS_QUERY = `
  [out:json][timeout:120];
  area["ISO3166-2"="IN-TN"]->.a;
  (
    nwr["amenity"="hospital"](area.a);
    nwr["amenity"="blood_bank"](area.a);
    nwr["healthcare"="blood_donation"](area.a);
  );
  out center tags;
`;

async function fetchWithRetry(url, query, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Fetching from Overpass (Attempt ${i + 1})...`);
      const res = await axios.get(`${url}?data=${encodeURIComponent(query)}`, {
        headers: { 
          'User-Agent': 'LifeConnect-DataBot/1.0',
          'Accept': '*/*'
        },
        timeout: 120000
      });
      return res.data;
    } catch (err) {
      console.warn(`Error on attempt ${i + 1}: ${err.message}`);
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const data = await fetchWithRetry('https://overpass-api.de/api/interpreter', OVERPASS_QUERY);
  
  if (!data.elements || data.elements.length === 0) {
    console.log('No data returned from Overpass.');
    process.exit(0);
  }

  let inserted = 0, updated = 0, skipped = 0;

  for (const el of data.elements) {
    if (!el.tags || !el.tags.name) continue;

    const lat = el.lat || el.center?.lat;
    const lng = el.lon || el.center?.lon;
    if (!lat || !lng) continue;

    const name = el.tags.name;
    const phone = el.tags.phone || el.tags['contact:phone'] || '';
    const cleanPhone = phone.replace(/[^\d+]/g, '');

    const addr = [
      el.tags['addr:street'],
      el.tags['addr:suburb'],
      el.tags['addr:city'],
      el.tags['addr:postcode']
    ].filter(Boolean).join(', ');

    const district = el.tags['addr:district'] || findNearestDistrict(lng, lat);
    let matchedDistrict = DISTRICTS.find(d => d.toLowerCase() === district.toLowerCase()) || findNearestDistrict(lng, lat);

    let type = 'Private Hospital';
    if (el.tags.amenity === 'blood_bank' || el.tags.healthcare === 'blood_donation') type = 'Blood Bank';
    else if (el.tags['operator:type'] === 'government' || el.tags.operator === 'government') type = 'Government Hospital';

    const is24x7 = el.tags.emergency === 'yes' || el.tags['opening_hours'] === '24/7';

    // Dedupe key: OSM ID
    const sourceId = `osm_${el.type}_${el.id}`;

    const hospitalData = {
      uid: 'system',
      name: name,
      type: type,
      district: matchedDistrict,
      address: addr || matchedDistrict,
      phone: cleanPhone || 'Not Provided',
      lat: lat,
      lng: lng,
      location: { type: 'Point', coordinates: [lng, lat] },
      is24x7: is24x7,
      status: 'Approved',
      verified: false,
      source: 'OpenStreetMap',
      sourceId: sourceId,
      importedAt: new Date(),
      lastVerifiedAt: new Date()
    };

    try {
      // Find exact same sourceId first
      let existing = await Hospital.findOne({ sourceId: sourceId });
      
      // If not found, try finding nearby (200m) with the same name
      if (!existing) {
        existing = await Hospital.findOne({
          name: name,
          location: {
            $near: {
              $geometry: { type: 'Point', coordinates: [lng, lat] },
              $maxDistance: 200 // 200 meters
            }
          }
        });
      }

      if (existing) {
        await Hospital.updateOne({ _id: existing._id }, { $set: hospitalData });
        updated++;
      } else {
        await Hospital.create(hospitalData);
        inserted++;
      }
    } catch (err) {
      console.error(`Error saving ${name}:`, err.message);
      skipped++;
    }
  }

  console.log(`\nOSM Import Summary:`);
  console.log(`Inserted: ${inserted}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped (errors): ${skipped}`);
  process.exit(0);
}

run().catch(console.error);
