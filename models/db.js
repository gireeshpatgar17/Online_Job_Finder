// Purpose: Connect Mongoose to the MongoDB URI configured for this environment.
const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/onlineJobFinder';
  await mongoose.connect(uri);
  console.log('MongoDB connected');
}

module.exports = connectDB;
