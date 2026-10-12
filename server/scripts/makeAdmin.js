require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const User = require('../src/models/User');

async function makeAdmin() {
  try {
    let mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('Connected to DB');

    // Upgrade all users to superadmin for local dev
    const res = await User.updateMany({}, { role: 'superadmin' });
    console.log(`Upgraded ${res.modifiedCount} users to superadmin.`);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

makeAdmin();
