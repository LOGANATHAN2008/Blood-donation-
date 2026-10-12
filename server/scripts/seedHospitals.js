require('dotenv').config();
const mongoose = require('mongoose');
const Hospital = require('../src/models/Hospital');

const HOSPITALS = [
  // --- KARNATAKA / BENGALURU URBAN ---
  {
    name: 'Manipal Hospital Bengaluru',
    type: 'Private Hospital',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    address: '98, HAL Old Airport Rd, Kodihalli, Bengaluru - 560017',
    phone: '080-25024444',
    lat: 12.9592,
    lng: 77.6499,
    is24x7: true,
  },
  {
    name: 'Victoria Hospital & Blood Bank',
    type: 'Government Hospital',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    address: 'Fort Road, near City Market, Kalasipalya, Bengaluru - 560002',
    phone: '080-26701150',
    lat: 12.9634,
    lng: 77.5756,
    is24x7: true,
  },
  {
    name: 'NIMHANS Blood Bank & Trauma Center',
    type: 'Trauma Center',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    address: 'Hosur Road, Lakkasandra, Bengaluru - 560029',
    phone: '080-26995000',
    lat: 12.9392,
    lng: 77.5960,
    is24x7: true,
  },
  {
    name: 'Bowring and Lady Curzon Hospital',
    type: 'Government Hospital',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    address: 'Hospital Road, Shivaji Nagar, Bengaluru - 560001',
    phone: '080-25591325',
    lat: 12.9822,
    lng: 77.6033,
    is24x7: true,
  },
  {
    name: 'Rashtrotthana Blood Centre',
    type: 'Blood Bank',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    address: 'Kempegowda Nagar, Chamrajpet, Bengaluru - 560019',
    phone: '080-26612730',
    lat: 12.9545,
    lng: 77.5623,
    is24x7: true,
  },
  {
    name: 'St. John’s Medical College Hospital',
    type: 'Medical College',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    address: 'Sarjapur Main Rd, John Nagar, Koramangala, Bengaluru - 560034',
    phone: '080-22065000',
    lat: 12.9317,
    lng: 77.6214,
    is24x7: true,
  },
  {
    name: 'Narayana Health City',
    type: 'Private Hospital',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    address: '258/A, Bommasandra Industrial Area, Anekal Taluk, Bengaluru - 560099',
    phone: '080-71222222',
    lat: 12.8174,
    lng: 77.6917,
    is24x7: true,
  },
  {
    name: 'Apollo Hospital Bannerghatta',
    type: 'Private Hospital',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    address: '154/11, Bannerghatta Main Rd, Krishnaraju Layout, Bengaluru - 560076',
    phone: '080-26304050',
    lat: 12.8942,
    lng: 77.5985,
    is24x7: true,
  },
  {
    name: 'Bangalore Baptist Hospital',
    type: 'Private Hospital',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    address: 'Bellary Rd, Vinayakanagar, Hebbal, Bengaluru - 560024',
    phone: '080-22024700',
    lat: 13.0315,
    lng: 77.5888,
    is24x7: true,
  },
  {
    name: 'KC General Hospital',
    type: 'Government Hospital',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    address: '5th Cross Rd, Malleshwaram, Bengaluru - 560003',
    phone: '080-23341771',
    lat: 12.9991,
    lng: 77.5714,
    is24x7: true,
  },

  // --- KARNATAKA / MYSURU ---
  {
    name: 'KR Hospital & Blood Bank',
    type: 'Government Hospital',
    state: 'Karnataka',
    district: 'Mysuru',
    address: 'Sayyaji Rao Rd, Medar Block, Yadavagiri, Mysuru - 570001',
    phone: '0821-2520512',
    lat: 12.3160,
    lng: 76.6504,
    is24x7: true,
  },
  {
    name: 'JSS Hospital',
    type: 'Medical College',
    state: 'Karnataka',
    district: 'Mysuru',
    address: 'Ramanuja Rd, Agrahara, Fort Mohalla, Mysuru - 570004',
    phone: '0821-2335555',
    lat: 12.2965,
    lng: 76.6528,
    is24x7: true,
  },

  // --- TAMIL NADU / CHENNAI ---
  {
    name: 'Rajiv Gandhi Government General Hospital Blood Bank',
    type: 'Government Hospital',
    state: 'Tamil Nadu',
    district: 'Chennai',
    address: 'EVR Periyar Salai, Park Town, Chennai - 600003',
    phone: '044-25305000',
    lat: 13.0810,
    lng: 80.2740,
    is24x7: true,
  },
  {
    name: 'Apollo Hospital Greams Road',
    type: 'Private Hospital',
    state: 'Tamil Nadu',
    district: 'Chennai',
    address: '21 Greams Lane, Thousand Lights, Chennai - 600006',
    phone: '044-28290200',
    lat: 13.0604,
    lng: 80.2505,
    is24x7: true,
  },
  {
    name: 'Government Stanley Medical College Hospital',
    type: 'Medical College',
    state: 'Tamil Nadu',
    district: 'Chennai',
    address: 'Old Jail Rd, George Town, Chennai - 600001',
    phone: '044-25281351',
    lat: 13.1075,
    lng: 80.2865,
    is24x7: true,
  },
  {
    name: 'MIOT International Hospital',
    type: 'Trauma Center',
    state: 'Tamil Nadu',
    district: 'Chennai',
    address: '4/112 Mount Poonamallee Road, Manapakkam, Chennai - 600089',
    phone: '044-42002288',
    lat: 13.0182,
    lng: 80.1783,
    is24x7: true,
  },
  {
    name: 'Lions Blood Bank Chennai',
    type: 'Blood Bank',
    state: 'Tamil Nadu',
    district: 'Chennai',
    address: '130 Marshalls Road, Egmore, Chennai - 600008',
    phone: '044-28551717',
    lat: 13.0694,
    lng: 80.2584,
    is24x7: true,
  },

  // --- TAMIL NADU / COIMBATORE ---
  {
    name: 'Coimbatore Medical College Hospital (CMCH)',
    type: 'Government Hospital',
    state: 'Tamil Nadu',
    district: 'Coimbatore',
    address: 'Trichy Rd, Gopalapuram, Coimbatore - 641018',
    phone: '0422-2301393',
    lat: 11.0006,
    lng: 76.9692,
    is24x7: true,
  },
  {
    name: 'KMCH Hospital & Blood Bank',
    type: 'Private Hospital',
    state: 'Tamil Nadu',
    district: 'Coimbatore',
    address: '99 Avinashi Road, Civil Aerodrome Post, Coimbatore - 641014',
    phone: '0422-4323800',
    lat: 11.0378,
    lng: 77.0396,
    is24x7: true,
  },
  {
    name: 'G. Kuppuswamy Naidu Memorial Hospital (GKNM)',
    type: 'Private Hospital',
    state: 'Tamil Nadu',
    district: 'Coimbatore',
    address: 'Netaji Road, Pappanaickenpalayam, Coimbatore - 641037',
    phone: '0422-4305300',
    lat: 11.0142,
    lng: 76.9806,
    is24x7: true,
  },

  // --- TAMIL NADU / VELLORE ---
  {
    name: 'Christian Medical College (CMC) Hospital',
    type: 'Medical College',
    state: 'Tamil Nadu',
    district: 'Vellore',
    address: 'Ida Scudder Road, Vellore - 632004',
    phone: '0416-2281000',
    lat: 12.9248,
    lng: 79.1350,
    is24x7: true,
  },
  {
    name: 'Government Vellore Medical College Hospital',
    type: 'Government Hospital',
    state: 'Tamil Nadu',
    district: 'Vellore',
    address: 'Adukkamparai, Vellore - 632011',
    phone: '0416-2260900',
    lat: 12.8715,
    lng: 79.1345,
    is24x7: true,
  },

  // --- TAMIL NADU / MADURAI ---
  {
    name: 'Government Rajaji Hospital (GRH)',
    type: 'Government Hospital',
    state: 'Tamil Nadu',
    district: 'Madurai',
    address: 'Panagal Road, Madurai Main, Madurai - 625020',
    phone: '0452-2532535',
    lat: 9.9325,
    lng: 78.1275,
    is24x7: true,
  },
  {
    name: 'Meenakshi Mission Hospital & Research Centre',
    type: 'Private Hospital',
    state: 'Tamil Nadu',
    district: 'Madurai',
    address: 'Melur Main Rd, Lake Expanse, Madurai - 625107',
    phone: '0452-2588741',
    lat: 9.9576,
    lng: 78.1633,
    is24x7: true,
  },

  // --- TAMIL NADU / SALEM ---
  {
    name: 'Government Mohan Kumaramangalam Medical College Hospital',
    type: 'Government Hospital',
    state: 'Tamil Nadu',
    district: 'Salem',
    address: 'Fort Main Rd, Shevapet, Salem - 636001',
    phone: '0427-2211211',
    lat: 11.6542,
    lng: 78.1528,
    is24x7: true,
  },
  {
    name: 'Manipal Hospital Salem',
    type: 'Private Hospital',
    state: 'Tamil Nadu',
    district: 'Salem',
    address: 'Dalmia Board, Bangalore Highway, Salem - 636012',
    phone: '0427-2346600',
    lat: 11.6917,
    lng: 78.1189,
    is24x7: true,
  },

  // --- TAMIL NADU / TIRUCHIRAPPALLI ---
  {
    name: 'Mahatma Gandhi Memorial Government Hospital',
    type: 'Government Hospital',
    state: 'Tamil Nadu',
    district: 'Tiruchirappalli',
    address: 'Collector Office Road, Cantonment, Tiruchirappalli - 620017',
    phone: '0431-2415151',
    lat: 10.8031,
    lng: 78.6883,
    is24x7: true,
  },
  {
    name: 'Kauvery Hospital Trichy',
    type: 'Private Hospital',
    state: 'Tamil Nadu',
    district: 'Tiruchirappalli',
    address: 'No. 1, KC Road, Tennur, Tiruchirappalli - 620017',
    phone: '0431-4006600',
    lat: 10.8222,
    lng: 78.6853,
    is24x7: true,
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    let inserted = 0;
    let updated = 0;

    for (const h of HOSPITALS) {
      const doc = {
        ...h,
        uid: 'system',
        status: 'Approved',
        hidden: false,
        verified: true,
        source: 'Verified Directory',
        location: {
          type: 'Point',
          coordinates: [h.lng, h.lat],
        },
      };

      const res = await Hospital.findOneAndUpdate(
        { name: h.name, state: h.state },
        { $set: doc },
        { upsert: true, new: true }
      );
      if (res.isNew) inserted++;
      else updated++;
    }

    console.log(`Seeding complete. Inserted/Updated: ${HOSPITALS.length} hospitals.`);
  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    process.exit(0);
  }
}

seed();
