// Purpose: Define applicant and recruiter accounts, company details, and unique usernames.
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true, default: '' },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['applicant', 'recruiter'], default: 'applicant' },
  company: { type: String, trim: true, default: '' }
}, { timestamps: true });

userSchema.index({ name: 1 }, { unique: true });
module.exports = mongoose.model('User', userSchema);
