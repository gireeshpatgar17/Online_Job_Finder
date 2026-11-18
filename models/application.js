const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['Submitted', 'Under Review', 'Interview', 'Rejected', 'Accepted'], default: 'Submitted' },
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
  certificates: [String],
  github: String,
  personalWebsite: String,
  resume: String
}, { timestamps: { createdAt: 'submittedAt', updatedAt: false } });

applicationSchema.index(
  { applicant: 1, job: 1 },
  {
    unique: true,
    partialFilterExpression: {
      applicant: { $type: 'objectId' },
      job: { $type: 'objectId' }
    }
  }
);

module.exports = mongoose.model('Application', applicationSchema);
