// Purpose: Accept job-specific applicant questions and route each message to the owning recruiter.
const express = require('express');
const mongoose = require('mongoose');
const Job = require('../models/jobpost');
const Contact = require('../models/contact');
const router = express.Router();

router.get('/contact/:jobId', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.jobId)) return res.status(404).send('Job not found');
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).send('Job not found');
    if (job.isOpen === false || (job.deadline && job.deadline < new Date(new Date().setHours(0, 0, 0, 0)))) return res.status(410).send('This job is closed and no longer accepting messages.');
    res.render('contact', { job, success: req.query.success || null, error: req.query.error || null });
  } catch (err) { next(err); }
});

router.post('/contact/:jobId', async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).send('Job not found');
    if (job.isOpen === false || (job.deadline && job.deadline < new Date(new Date().setHours(0, 0, 0, 0)))) return res.status(410).send('This job is closed and no longer accepting messages.');
    const { name, email, message } = req.body;
    if (![name, email, message].every(value => typeof value === 'string' && value.trim())) {
      return res.status(400).render('contact', { job, success: null, error: 'Name, email, and message are required.' });
    }
    await Contact.create({ job: job._id, recruiter: job.postedBy, sender: req.session.user?._id, name: name.trim(), email: email.trim(), message: message.trim() });
    res.redirect(`/contact/${job._id}?success=${encodeURIComponent('Message sent successfully')}`);
  } catch (err) { next(err); }
});

module.exports = router;
