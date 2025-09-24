const mongoose = require('mongoose');

const jobPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String, // e.g., Full-time, Part-time, Internship
    required: true
  },
  deadline: {
    type: Date
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recruiter', // Link to recruiter model
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  icon: {
    type: String,  // This will store the name of the image file (e.g., job-offer.png)
    required: true  // The icon will always be assigned when posting a job
  }
});

const Job = mongoose.model('Job', jobPostSchema);
module.exports = Job;
