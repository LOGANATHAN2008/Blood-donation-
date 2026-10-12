require('dotenv').config();
const mongoose = require('mongoose');
const Hospital = require('../src/models/Hospital');

const dummyOsmHospitals = [
  {
    uid: 'system',
    name: 'Kandasamy Hospital',
    type: 'Private Hospital',
    district: 'Coimbatore',
    address: 'Avinashi Road, Coimbatore - 641018',
    phone: '0422-2244556',
    lat: 11.0168,
    lng: 76.9558,
    location: { type: 'Point', coordinates: [76.9558, 11.0168] },
    is24x7: true,
    status: 'Approved',
    verified: false,
    source: 'OpenStreetMap',
    sourceId: 'osm_node_12345',
    importedAt: new Date(),
    lastVerifiedAt: new Date()
  },
  {
    uid: 'system',
    name: 'Apollo Speciality Hospital',
    type: 'Private Hospital',
    district: 'Madurai',
    address: 'Lake View Road, K.K. Nagar, Madurai',
    phone: '0452-2580892',
    lat: 9.9252,
    lng: 78.1198,
    location: { type: 'Point', coordinates: [78.1198, 9.9252] },
    is24x7: true,
    status: 'Approved',
    verified: false,
    source: 'OpenStreetMap',
    sourceId: 'osm_way_67890',
    importedAt: new Date(),
    lastVerifiedAt: new Date()
  },
  {
    uid: 'system',
    name: 'Kauvery Hospital',
    type: 'Private Hospital',
    district: 'Tiruchirappalli',
    address: '1, K.C. Road, Tennur, Trichy',
    phone: '0431-4022555',
    lat: 10.8050,
    lng: 78.6856,
    location: { type: 'Point', coordinates: [78.6856, 10.8050] },
    is24x7: true,
    status: 'Approved',
    verified: false,
    source: 'OpenStreetMap',
    sourceId: 'osm_node_112233',
    importedAt: new Date(),
    lastVerifiedAt: new Date()
  },
  {
    uid: 'system',
    name: 'Government Hospital - Ooty',
    type: 'Government Hospital',
    district: 'Nilgiris',
    state: 'Tamil Nadu',
    address: 'Hospital Road, Ooty',
    phone: '0423-2442212',
    lat: 11.4118,
    lng: 76.7321,
    location: { type: 'Point', coordinates: [76.7321, 11.4118] },
    is24x7: true,
    status: 'Approved',
    verified: false,
    source: 'OpenStreetMap',
    sourceId: 'osm_node_998877',
    importedAt: new Date(),
    lastVerifiedAt: new Date()
  },
  {
    uid: 'system',
    name: 'Manipal Hospital',
    type: 'Private Hospital',
    district: 'Bengaluru',
    state: 'Karnataka',
    address: '98, HAL Old Airport Rd, Bengaluru',
    phone: '080-25024444',
    lat: 12.9592,
    lng: 77.6499,
    location: { type: 'Point', coordinates: [77.6499, 12.9592] },
    is24x7: true,
    status: 'Approved',
    verified: true,
    source: 'user',
    sourceId: 'dummy_kar_1',
    importedAt: new Date(),
    lastVerifiedAt: new Date()
  },
  {
    uid: 'system',
    name: 'Victoria Hospital',
    type: 'Government Hospital',
    district: 'Bengaluru',
    state: 'Karnataka',
    address: 'Fort Rd, Kalasipalyam, Bengaluru',
    phone: '080-26701150',
    lat: 12.9634,
    lng: 77.5746,
    location: { type: 'Point', coordinates: [77.5746, 12.9634] },
    is24x7: true,
    status: 'Approved',
    verified: true,
    source: 'user',
    sourceId: 'dummy_kar_2',
    importedAt: new Date(),
    lastVerifiedAt: new Date()
  }
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');
  let inserted = 0;
  for (const h of dummyOsmHospitals) {
    const existing = await Hospital.findOne({ sourceId: h.sourceId });
    if (!existing) {
      await Hospital.create(h);
      inserted++;
    }
  }
  console.log(`Inserted ${inserted} mock OSM records.`);
  process.exit(0);
}

run().catch(console.error);
