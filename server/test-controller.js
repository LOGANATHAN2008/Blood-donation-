const mongoose = require('mongoose');
const { completeOnboarding } = require('./src/controllers/userController');
const User = require('./src/models/User');
require('dotenv').config();

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lifeconnect');
    console.log("Connected");

    // 1. Create a dummy user
    const dummyUid = "test_user_123";
    await User.deleteOne({ uid: dummyUid });
    const user = new User({
      uid: dummyUid,
      name: 'User',
      phone: '7010123479',
      verifiedPhone: '7010123479',
      providers: ['phone']
    });
    await user.save();
    console.log("Saved dummy user");

    // 2. Mock req, res, next
    const req = {
      user: { uid: dummyUid },
      body: {
        name: 'Loganathan',
        dob: '2008-08-08',
        gender: 'Male',
        phone: '7010123479',
        state: 'Tamil Nadu',
        district: 'Vellore',
        city: 'AMBUR'
      }
    };

    let responseData = null;
    const res = {
      json: (data) => {
        responseData = data;
        console.log("Success Response:", data);
      },
      status: (code) => res
    };

    let errorData = null;
    const next = (err) => {
      errorData = err;
      console.log("Error Response:", err);
    };

    await completeOnboarding(req, res, next);
    
    if (errorData) {
      if (errorData.errors) {
        console.log("Zod errors:", JSON.stringify(errorData.errors, null, 2));
      }
    }
  } catch (err) {
    console.error("Test script crashed:", err);
  } finally {
    mongoose.disconnect();
  }
}
test();
