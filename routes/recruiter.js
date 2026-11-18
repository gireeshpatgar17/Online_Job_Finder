const express = require('express');
const Contact = require('../models/contact');
const Job = require('../models/jobpost');
const Application = require('../models/application');
const fs = require('fs');
const path = require('path');
const { requireRole } = require('./middleware');
const router = express.Router();

router.get('/recruiter-dashboard', requireRole('recruiter'), async (req, res, next) => {
  try {
    const userId = req.session.user._id;
    const jobs = await Job.find({ postedBy: userId }).sort({ createdAt: -1 });
    const jobIds = jobs.map(job => job._id);
    const [messages, applications] = await Promise.all([
      Contact.find({ recruiter: userId }).populate('job', 'title').populate('sender', 'name email').sort({ createdAt: -1 }),
      Application.find({ job: { $in: jobIds } }).populate('job', 'title').sort({ submittedAt: -1 })
    ]);
    const dashboardMessages = messages.map(message => {
      const item = message.toObject();
      item.sender = item.sender || { name: item.name, email: item.email };
      return item;
    });
    res.render('recruiter-dashboard', {
      user: req.session.user, jobs, messages: dashboardMessages, applications,
      jobPosted: req.query.posted === '1', jobUpdated: req.query.updated === '1',
      jobDeleted: req.query.deleted === '1', jobStatusChanged: req.query.statusChanged === '1'
    });
  } catch (err) { next(err); }
});

router.put('/recruiter/jobs/:id/open', requireRole('recruiter'), async (req, res, next) => {
  try {
    if (typeof req.body.isOpen !== 'boolean') return res.status(400).json({ error: 'Invalid job status.' });
    const job = await Job.findOne({ _id: req.params.id, postedBy: req.session.user._id });
    if (!job) return res.status(404).json({ error: 'Job not found.' });
    if (req.body.isOpen && job.deadline && job.deadline < new Date(new Date().setHours(0, 0, 0, 0))) {
      return res.status(400).json({ error: 'Set a future deadline before reopening this job.' });
    }
    job.isOpen = req.body.isOpen;
    await job.save();
    res.json({ isOpen: job.isOpen });
  } catch (err) { next(err); }
});

router.delete('/recruiter/jobs/:id', requireRole('recruiter'), async (req, res, next) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, postedBy: req.session.user._id });
    if (!job) return res.status(404).json({ error: 'Job not found.' });
    const applicationsForJob = await Application.find({ job: job._id }).select('resume certificates');
    const uploadDirectory = path.join(__dirname, '..', 'storage', 'uploads');
    for (const application of applicationsForJob) {
      const files = [application.resume, ...(application.certificates || [])].filter(Boolean);
      for (const filename of files) await fs.promises.unlink(path.join(uploadDirectory, path.basename(filename))).catch(() => {});
    }
    await Promise.all([
      Application.deleteMany({ job: job._id }),
      Contact.deleteMany({ job: job._id }),
      Job.deleteOne({ _id: job._id, postedBy: req.session.user._id })
    ]);
    res.json({ deleted: true });
  } catch (err) { next(err); }
});

router.put('/applications/:id/status', requireRole('recruiter'), async (req, res, next) => {
  try {
    const allowedStatuses = ['Submitted', 'Under Review', 'Interview', 'Rejected', 'Accepted'];
    if (!allowedStatuses.includes(req.body.status)) return res.status(400).json({ error: 'Invalid application status.' });
    const application = await Application.findById(req.params.id);
    if (!application) return res.status(404).json({ error: 'Application not found.' });
    const job = await Job.findOne({ _id: application.job, postedBy: req.session.user._id });
    if (!job) return res.status(404).json({ error: 'Application not found.' });
    application.status = req.body.status;
    await application.save();
    res.json({ status: application.status });
  } catch (err) { next(err); }
});

router.put('/messages/:id/read', requireRole('recruiter'), async (req, res, next) => {
  try {
    const message = await Contact.findOneAndUpdate({ _id: req.params.id, recruiter: req.session.user._id }, { status: 'read' }, { new: true });
    if (!message) return res.status(404).json({ error: 'Message not found' });
    res.json({ status: message.status });
  } catch (err) { next(err); }
});

router.delete('/messages/:id', requireRole('recruiter'), async (req, res, next) => {
  try {
    const message = await Contact.findOneAndDelete({ _id: req.params.id, recruiter: req.session.user._id });
    if (!message) return res.status(404).json({ error: 'Message not found' });
    res.json({ message: 'Message deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
