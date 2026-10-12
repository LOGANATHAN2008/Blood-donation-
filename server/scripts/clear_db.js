const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

async function clearDB() {
  try {
    const MONGODB_URI = "mongodb+srv://loganathan082008_db_user:mN8AqN8w8bOz7nkG@cluster0.ifb669x.mongodb.net/lifeconnect?retryWrites=true&w=majority";
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');
    
    await mongoose.connection.db.dropDatabase();
    console.log('Dropped entire database to remove all dummy data.');

    await mongoose.disconnect();
    console.log('Disconnected');
  } catch (err) {
    console.error(err);
  }
}

clearDB();
