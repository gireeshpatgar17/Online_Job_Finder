const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const Application = require('../models/application');
const Job = require('../models/jobpost');
const mongoose = require('mongoose');
const { requireRole } = require('./middleware');
const router = express.Router();
const uploadDir = path.join(__dirname, '..', 'storage', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`)
});
const allowedExt = new Set(['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg']);
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 6 },
  fileFilter: (req, file, cb) => allowedExt.has(path.extname(file.originalname).toLowerCase()) ? cb(null, true) : cb(Object.assign(new Error('Use PDF, Word, PNG, or JPG files.'), { status: 400 }))
});

async function removeSavedFiles(files) {
  await Promise.all(files.map(file => fs.promises.unlink(file).catch(() => {})));
}

router.get('/apply', requireRole('applicant'), async (req, res, next) => {
  try {
    const jobId = req.query.jobId;
    if (!jobId || !mongoose.isValidObjectId(jobId)) return res.redirect('/');
    const job = await Job.findOne({ _id: jobId, isOpen: { $ne: false }, $or: [{ deadline: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }, { deadline: { $exists: false } }, { deadline: null }] });
    if (!job) return res.status(404).send('This job is closed or no longer accepting applications.');
    const alreadyApplied = await Application.exists({ job: job._id, applicant: req.session.user._id });
    res.render('apply', { success: null, error: null, alreadyApplied: Boolean(alreadyApplied), job });
  } catch (err) { next(err); }
});

router.get('/my-applications', requireRole('applicant'), async (req, res, next) => {
  try {
    const applications = await Application.find({ applicant: req.session.user._id })
      .populate('job', 'title companyName type location deadline isOpen')
      .sort({ submittedAt: -1 });
    res.render('my-applications', { user: req.session.user, applications });
  } catch (err) { next(err); }
});

async function downloadApplicationFile(req, res, next, kind, index) {
  try {
    const application = await Application.findById(req.params.id).populate('job', 'postedBy');
    if (!application || !application.job || String(application.job.postedBy) !== String(req.session.user._id)) {
      return res.status(404).send('File not found');
    }
    let filename = kind === 'resume' ? application.resume : null;
    if (kind === 'certificate' && Number.isInteger(index) && index >= 0) {
      filename = application.certificates[index];
    }
    if (!filename) return res.status(404).send('File not found');
    res.download(path.join(uploadDir, path.basename(filename)));
  } catch (err) { next(err); }
}

router.get('/applications/:id/files/resume', requireRole('recruiter'), (req, res, next) =>
  downloadApplicationFile(req, res, next, 'resume')
);
router.get('/applications/:id/files/certificate/:index', requireRole('recruiter'), (req, res, next) => {
  const index = /^\d+$/.test(req.params.index) ? Number(req.params.index) : -1;
  downloadApplicationFile(req, res, next, 'certificate', index);
});

router.post('/apply', requireRole('applicant'), upload.fields([{ name: 'certificates', maxCount: 5 }, { name: 'resume', maxCount: 1 }]), async (req, res, next) => {
  const savedFiles = Object.values(req.files || {}).flat().map(file => file.path);
  try {
    const { name, dob, age, gender, address, email, phone, degree, specialization, university, gradYear, percentage, experienceYears, previousRole, companyName, jobDuration, keyResponsibilities, skills, github, personalWebsite, jobId } = req.body;
    const job = jobId && mongoose.isValidObjectId(jobId)
      ? await Job.findOne({ _id: jobId, isOpen: { $ne: false }, $or: [{ deadline: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }, { deadline: { $exists: false } }, { deadline: null }] })
      : null;
    if (!job) {
      await removeSavedFiles(savedFiles);
      return res.status(404).send('Job not found or no longer accepting applications.');
    }
    const priorApplication = await Application.exists({ job: job._id, applicant: req.session.user._id });
    if (priorApplication) {
      await removeSavedFiles(savedFiles);
      return res.status(409).render('apply', {
        success: null, error: null, alreadyApplied: true, job
      });
    }
    if (![name, dob, gender, email, phone, degree, specialization, university, gradYear, skills].every(value => String(value || '').trim()) || !req.files?.resume?.length) {
      await removeSavedFiles(savedFiles);
      return res.status(400).render('apply', { success: null, error: 'Fill in the required fields and attach a resume.', alreadyApplied: false, job });
    }
    const files = req.files || {};
    await Application.create({
      job: job._id, applicant: req.session.user._id, name, dob, age: age || undefined, gender, address, email, phone,
      degree, specialization, university, gradYear, percentage, experienceYears, previousRole, companyName, jobDuration,
      keyResponsibilities, skills, certificates: (files.certificates || []).map(file => file.filename),
      github, personalWebsite, resume: files.resume[0].filename
    });
    return res.render('apply', { success: 'Your application has been submitted successfully!', error: null, alreadyApplied: false, job });
  } catch (err) {
    await removeSavedFiles(savedFiles);
    if (err.code === 11000 && err.keyPattern?.applicant && err.keyPattern?.job) {
      const jobId = req.body.jobId;
      const job = mongoose.isValidObjectId(jobId) ? await Job.findById(jobId).catch(() => null) : null;
      return res.status(409).render('apply', { success: null, error: null, alreadyApplied: true, job });
    }
    next(err);
  }
});

module.exports = router;
