const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
  name: String,
  dob: String,
  age: Number,
  gender: String,
  address: String,
  email: String,
  phone: String,
  degree: String,
  specialization: String,
  university: String,
  gradYear: Number,
  percentage: String,
  experienceYears: Number,
  previousRole: String,
  companyName: String,
  jobDuration: String,
  keyResponsibilities: String,
  skills: String,
  certificates: [String], // Multiple files
  github: String,
  personalWebsite: String,
  resume: String, // This will store the file name or path


  submittedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Application", applicationSchema);
