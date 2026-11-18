// Purpose: Search active job listings, calculate database-backed filter counts, sort results, and paginate them.
const express = require('express');
const Job = require('../models/jobpost');
const router = express.Router();

const PAGE_SIZE = 10;
const seniorityOptions = ['Student / Intern', 'Entry Level', 'Mid Level', 'Senior Level', 'Lead / Manager', 'Director / VP'];
const salaryBands = [
  { id: 'under-3', label: 'Under ₹3 LPA', min: 0, max: 300000 },
  { id: '3-6', label: '₹3–6 LPA', min: 300000, max: 600000 },
  { id: '6-12', label: '₹6–12 LPA', min: 600000, max: 1200000 },
  { id: '12-20', label: '₹12–20 LPA', min: 1200000, max: 2000000 },
  { id: '20-plus', label: '₹20 LPA and above', min: 2000000, max: Infinity }
];

function asArray(value) {
  return (Array.isArray(value) ? value : value == null ? [] : [value]).filter(item => typeof item === 'string');
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function makeFilter({ query, employment, seniority, salary }) {
  const clauses = [{ isOpen: { $ne: false } }, { $or: [{ deadline: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }, { deadline: { $exists: false } }, { deadline: null }] }];
  const term = String(query || '').trim().slice(0, 100);
  if (term) {
    const pattern = new RegExp(escapeRegex(term), 'i');
    clauses.push({ $or: [{ title: pattern }, { role: pattern }, { description: pattern }, { companyName: pattern }, { location: pattern }] });
  }
  if (employment.length) clauses.push({ type: { $in: employment } });
  if (seniority.length) clauses.push({ seniorityLevel: { $in: seniority } });
  if (salary.length) {
    const ranges = salary.map(id => salaryBands.find(band => band.id === id)).filter(Boolean).map(band => ({
      ...(Number.isFinite(band.max) ? { salaryMin: { $lte: band.max } } : {}),
      salaryMax: { $gte: band.min }
    }));
    if (ranges.length) clauses.push({ $or: ranges });
  }
  return { $and: clauses };
}

function sortSpec(sort) {
  if (sort === 'oldest') return { createdAt: 1, _id: 1 };
  if (sort === 'salary') return { salaryMax: -1, salaryMin: -1, createdAt: -1 };
  if (sort === 'daysLeft') return { deadline: 1, createdAt: -1 };
  return { createdAt: -1, _id: -1 };
}

router.get('/', async (req, res, next) => {
  if (req.session.user?.role === 'recruiter') return res.redirect('/recruiter-dashboard');
  try {
    const query = String(req.query.q || '').trim().slice(0, 100);
    const employment = asArray(req.query.employment);
    const seniority = asArray(req.query.seniority);
    const salary = asArray(req.query.salary).filter(id => salaryBands.some(band => band.id === id));
    const sort = ['newest', 'oldest', 'salary', 'daysLeft'].includes(req.query.sort) ? req.query.sort : 'newest';
    const requestedPage = Number.parseInt(req.query.page, 10);
    const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

    const activeFilter = makeFilter({ query, employment: [], seniority: [], salary: [] });
    const employmentOptions = (await Job.distinct('type', activeFilter)).filter(Boolean).sort((a, b) => a.localeCompare(b));
    const total = await Job.countDocuments(makeFilter({ query, employment, seniority, salary }));
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const filter = makeFilter({ query, employment, seniority, salary });
    const [jobs, employmentCounts, seniorityCounts, salaryCounts] = await Promise.all([
      (sort === 'daysLeft'
        ? Job.aggregate([
          { $match: filter },
          { $addFields: { __deadlineSort: { $ifNull: ['$deadline', new Date('9999-12-31T00:00:00.000Z')] } } },
          { $sort: { __deadlineSort: 1, createdAt: -1, _id: -1 } },
          { $skip: (currentPage - 1) * PAGE_SIZE },
          { $limit: PAGE_SIZE },
          { $project: { __deadlineSort: 0 } }
        ]).then(rows => Job.populate(rows, { path: 'postedBy', select: 'name company' }))
        : Job.find(filter)
          .populate('postedBy', 'name company')
          .sort(sortSpec(sort))
          .skip((currentPage - 1) * PAGE_SIZE)
          .limit(PAGE_SIZE)),
      Promise.all(employmentOptions.map(async option => [option, await Job.countDocuments(makeFilter({ query, employment: [option], seniority, salary }))])),
      Promise.all(seniorityOptions.map(async option => [option, await Job.countDocuments(makeFilter({ query, employment, seniority: [option], salary }))])),
      Promise.all(salaryBands.map(async band => [band.id, await Job.countDocuments(makeFilter({ query, employment, seniority, salary: [band.id] }))]))
    ]);

    const queryParams = new URLSearchParams();
    if (query) queryParams.set('q', query);
    employment.forEach(value => queryParams.append('employment', value));
    seniority.forEach(value => queryParams.append('seniority', value));
    salary.forEach(value => queryParams.append('salary', value));
    if (sort !== 'newest') queryParams.set('sort', sort);
    res.render('index', {
      jobs, employmentOptions, seniorityOptions, salaryBands, selectedEmployment: employment,
      selectedSeniority: seniority, selectedSalary: salary, query, sort, total, currentPage,
      totalPages, pageSize: PAGE_SIZE,
      firstResult: total ? (currentPage - 1) * PAGE_SIZE + 1 : 0,
      lastResult: Math.min(currentPage * PAGE_SIZE, total),
      employmentCounts: Object.fromEntries(employmentCounts),
      seniorityCounts: Object.fromEntries(seniorityCounts),
      salaryCounts: Object.fromEntries(salaryCounts),
      paginationQuery: queryParams.toString(),
      paginationPrefix: queryParams.toString() ? `${queryParams.toString()}&` : ''
    });
  } catch (err) { next(err); }
});

module.exports = router;
