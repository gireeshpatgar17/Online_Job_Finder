// Purpose: Validate recruiter job posts, create/edit owned listings, and render job details.
const express = require('express');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const Job = require('../models/jobpost');
const { requireRole } = require('./middleware');
const router = express.Router();
const icons = ['job-offer.png', 'posting.png', 'promotion.png', 'search.png'];

const seniorityLevels = ['Student / Intern', 'Entry Level', 'Mid Level', 'Senior Level', 'Lead / Manager', 'Director / VP'];
const employmentTypes = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary', 'Apprenticeship'];

function readJobFields(body) {
  const { title, role, description, type, seniorityLevel, location, salaryMin, salaryMax, deadline } = body;
  const min = Number(salaryMin), max = Number(salaryMax);
  const deadlineDate = new Date(`${deadline}T00:00:00`);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (![title, role, description, location].every(value => typeof value === 'string' && value.trim()) ||
      !employmentTypes.includes(type) || !seniorityLevels.includes(seniorityLevel) ||
      salaryMin === '' || salaryMax === '' || !Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max < min ||
      !deadline || Number.isNaN(deadlineDate.getTime()) || deadlineDate < today || description.trim().length > 2000) {
    return { error: 'Check the required fields, employment and seniority selections, location, annual salary range, 2,000-character description limit, and future deadline.' };
  }
  return { values: { title: title.trim(), role: role.trim(), description: description.trim(), type, seniorityLevel, location: location.trim(), salaryMin: min, salaryMax: max, salaryCurrency: 'INR', deadline: deadlineDate } };
}

async function iconForJob() {
  const filename = icons[Math.floor(Math.random() * icons.length)];
  const imagesDir = path.join(__dirname, '..', 'public', 'images');
  const iconName = `resized-${filename}`;
  const iconPath = path.join(imagesDir, 'icons', iconName);
  if (!fs.existsSync(iconPath)) {
    await fs.promises.mkdir(path.dirname(iconPath), { recursive: true });
    await sharp(path.join(imagesDir, filename)).resize(50, 50).toFile(iconPath);
  }
  return `icons/${iconName}`;
}

router.get('/post-job', requireRole('recruiter'), (req, res) => res.render('postjob', { job: null, formAction: '/post-job', error: null }));

router.post('/post-job', requireRole('recruiter'), async (req, res, next) => {
  try {
    const parsed = readJobFields(req.body);
    if (parsed.error) return res.status(400).render('postjob', { job: null, formAction: '/post-job', error: parsed.error });
    await Job.create({ ...parsed.values, companyName: req.session.user.company || req.session.user.name, postedBy: req.session.user._id, icon: await iconForJob() });
    res.redirect('/recruiter-dashboard?posted=1');
  } catch (err) { next(err); }
});

router.get('/recruiter/jobs/:id/edit', requireRole('recruiter'), async (req, res, next) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, postedBy: req.session.user._id });
    if (!job) return res.status(404).send('Job not found');
    res.render('postjob', { job, formAction: `/recruiter/jobs/${job._id}/edit`, error: null });
  } catch (err) { next(err); }
});

router.post('/recruiter/jobs/:id/edit', requireRole('recruiter'), async (req, res, next) => {
  try {
    const existing = await Job.findOne({ _id: req.params.id, postedBy: req.session.user._id });
    if (!existing) return res.status(404).send('Job not found');
    const parsed = readJobFields(req.body);
    if (parsed.error) return res.status(400).render('postjob', { job: { ...existing.toObject(), ...req.body }, formAction: `/recruiter/jobs/${existing._id}/edit`, error: parsed.error });
    await Job.updateOne({ _id: existing._id, postedBy: req.session.user._id }, { $set: { ...parsed.values, companyName: req.session.user.company || req.session.user.name } }, { runValidators: true });
    res.redirect('/recruiter-dashboard?updated=1');
  } catch (err) { next(err); }
});

router.get('/jobs/:id', async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id).populate('postedBy', 'name company');
    if (!job) return res.status(404).send('Job not found');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const acceptingApplications = job.isOpen !== false && (!job.deadline || job.deadline >= today);
    res.render('job-details', { job, acceptingApplications });
  } catch (err) { next(err); }
});

module.exports = router;
