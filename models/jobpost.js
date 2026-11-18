const mongoose = require('mongoose');

const jobPostSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  role: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  type: { type: String, required: true, trim: true },
  seniorityLevel: { type: String, required: true, enum: ['Student / Intern', 'Entry Level', 'Mid Level', 'Senior Level', 'Lead / Manager', 'Director / VP'] },
  salaryMin: { type: Number, required: true, min: 0 },
  salaryMax: { type: Number, required: true, min: 0 },
  salaryCurrency: { type: String, default: 'INR', enum: ['INR'] },
  location: { type: String, trim: true, default: '' },
  companyName: { type: String, trim: true, default: '' },
  deadline: { type: Date },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  icon: { type: String, required: true },
  isOpen: { type: Boolean, default: true },
  seedKey: { type: String, unique: true, sparse: true }
});

module.exports = mongoose.model('Job', jobPostSchema);
