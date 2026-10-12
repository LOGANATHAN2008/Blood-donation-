const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User');
const BloodRequest = require('../src/models/BloodRequest');
const Hospital = require('../src/models/Hospital');
const Medicine = require('../src/models/Medicine');
const Donor = require('../src/models/Donor');
const { INDIA_STATES } = require('../src/utils/indiaLocations');

const ALIASES = {
  'orissa': 'Odisha',
  'pondicherry': 'Puducherry',
  'tamilnadu': 'Tamil Nadu',
  'tn': 'Tamil Nadu',
  'ap': 'Andhra Pradesh',
  'up': 'Uttar Pradesh',
  'mp': 'Madhya Pradesh',
  'j&k': 'Jammu and Kashmir',
  'delhi ncr': 'Delhi',
  'bengal': 'West Bengal'
};

function normalizeStateName(state) {
  if (!state) return 'Tamil Nadu'; // Fallback for old data where TN was implicit
  const lower = state.toLowerCase().trim();
  if (ALIASES[lower]) return ALIASES[lower];
  
  // Find closest match or exact match case insensitive
  const match = INDIA_STATES.find(s => s.toLowerCase() === lower);
  return match || 'Tamil Nadu'; // default fallback for unparseable old data
}

async function run() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error('MONGODB_URI not set');
    
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    const models = [
      { name: 'User', model: User },
      { name: 'BloodRequest', model: BloodRequest },
      { name: 'Hospital', model: Hospital },
      { name: 'Medicine', model: Medicine },
      { name: 'Donor', model: Donor }
    ];

    for (const { name, model } of models) {
      console.log(`Processing ${name}s...`);
      const docs = await model.find({});
      let updated = 0;
      
      for (const doc of docs) {
        // Only update if state is missing, or not in the exact canonical list
        if (!doc.state || !INDIA_STATES.includes(doc.state)) {
          const normalized = normalizeStateName(doc.state);
          doc.state = normalized;
          
          try {
            // Need to bypass strict validation if other old fields are invalid
            await model.updateOne({ _id: doc._id }, { $set: { state: normalized } });
            updated++;
          } catch (e) {
            console.error(`Failed to update ${name} ${doc._id}:`, e.message);
          }
        }
      }
      console.log(`Updated ${updated} ${name} records.`);
    }

    console.log('Normalization complete.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

run();
