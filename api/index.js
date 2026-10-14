const mongoose = require('mongoose');
const app = require('../server/src/index');

const DEFAULT_MONGO_URI = "mongodb+srv://loganathan082008_db_user:mN8AqN8w8bOz7nkG@cluster0.ifb669x.mongodb.net/lifeconnect?retryWrites=true&w=majority";

// Vercel Serverless Function entrypoint
module.exports = async (req, res) => {
  // Ensure MongoDB is connected on cold starts
  if (mongoose.connection.readyState !== 1) {
    try {
      const uri = process.env.MONGODB_URI || DEFAULT_MONGO_URI;
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 8000,
      });
    } catch (err) {
      console.warn('MongoDB connection warning in Vercel serverless:', err.message);
    }
  }

  // Pass request to Express app
  return app(req, res);
};
