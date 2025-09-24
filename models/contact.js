const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  recruiter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'recruiters',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'login'
  },
  name: {
    type: String,
    required: true // Always require name
  },
  email: {
    type: String,
    required: true // Always require email
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['unread', 'read'],
    default: 'unread'
  }
}, { timestamps: true });

// Pre-save hook to ensure data consistency
contactSchema.pre('save', async function(next) {
  if (this.user && !this.email) {
    const user = await mongoose.model('User').findById(this.user);
    if (user) {
      this.email = user.email;
      this.name = user.name;
    }
  }
  next();
});

module.exports = mongoose.model('Contact', contactSchema);