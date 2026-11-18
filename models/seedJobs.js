// Purpose: Seed one system sample recruiter and 20 complete job listings without creating restart duplicates.
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const User = require('./user');
const Job = require('./jobpost');

const opportunities = [
  ['Frontend Developer', 'Frontend Engineer', 'Build accessible React interfaces, collaborate with design, and improve performance across customer workflows.', 'Full-time', 'Entry Level', 600000, 1000000, 'Bengaluru', 'Northstar Digital', 3, 2, 'job-offer.png'],
  ['Backend Node.js Engineer', 'Backend Engineer', 'Develop REST services, work with MongoDB, and improve reliability through reviews and monitoring.', 'Full-time', 'Mid Level', 1200000, 1800000, 'Hyderabad', 'CloudHarbor', 5, 1, 'posting.png'],
  ['Data Analyst', 'Analytics', 'Turn product and operations data into clear dashboards, validated reports, and useful recommendations.', 'Full-time', 'Entry Level', 500000, 850000, 'Pune', 'MetricWorks', 9, 4, 'search.png'],
  ['Product Design Intern', 'Product Designer', 'Support user research, prototype mobile and web experiences, and document accessible design patterns.', 'Internship', 'Student / Intern', 240000, 360000, 'Remote', 'BrightPath Labs', 12, 6, 'promotion.png'],
  ['QA Automation Engineer', 'Quality Engineering', 'Create stable browser and API automation, investigate defects, and work with engineers on release quality.', 'Full-time', 'Mid Level', 900000, 1400000, 'Chennai', 'Evergreen Systems', 2, 3, 'job-offer.png'],
  ['Junior Java Developer', 'Software Engineer', 'Implement Java services, write unit tests, and learn the team delivery process with senior engineers.', 'Full-time', 'Entry Level', 550000, 900000, 'Mysuru', 'Cedar Technologies', 7, 5, 'posting.png'],
  ['Cloud Support Associate', 'Cloud Operations', 'Assist customers with cloud deployments, troubleshoot incidents, and maintain clear support notes.', 'Full-time', 'Entry Level', 500000, 800000, 'Bengaluru', 'Skyward Cloud', 10, 7, 'search.png'],
  ['UX Research Contractor', 'UX Research', 'Conduct interviews and usability sessions, synthesize findings, and share research readouts.', 'Contract', 'Mid Level', 1000000, 1600000, 'Remote', 'BrightPath Labs', 14, 8, 'promotion.png'],
  ['Mobile App Developer', 'Mobile Engineering', 'Build and maintain Android features, integrate APIs, and improve app stability and responsiveness.', 'Full-time', 'Mid Level', 1000000, 1600000, 'Kochi', 'Harbor Mobile', 1, 9, 'job-offer.png'],
  ['Technical Content Writer', 'Developer Education', 'Write tutorials and product guides, validate technical examples, and coordinate with engineering teams.', 'Part-time', 'Mid Level', 450000, 700000, 'Remote', 'OpenLeaf Learning', 6, 10, 'posting.png'],
  ['Data Science Associate', 'Data Science', 'Prepare datasets, build baseline models, and explain analytical results to product stakeholders.', 'Full-time', 'Entry Level', 800000, 1300000, 'Hyderabad', 'MetricWorks', 11, 11, 'search.png'],
  ['DevOps Engineer', 'Platform Engineering', 'Improve CI/CD pipelines, automate infrastructure, and help teams operate dependable services.', 'Full-time', 'Senior Level', 1800000, 2800000, 'Bengaluru', 'Skyward Cloud', 4, 12, 'promotion.png'],
  ['Customer Success Specialist', 'Customer Success', 'Onboard business customers, resolve product questions, and share recurring feedback with product teams.', 'Full-time', 'Mid Level', 600000, 950000, 'Delhi', 'Northstar Digital', 8, 13, 'job-offer.png'],
  ['Security Analyst', 'Cybersecurity', 'Review security alerts, support vulnerability triage, and document remediation with engineering teams.', 'Full-time', 'Mid Level', 1100000, 1800000, 'Pune', 'Cedar Technologies', 15, 14, 'posting.png'],
  ['Product Manager', 'Product Management', 'Define product outcomes, prioritize customer needs, and coordinate delivery across design and engineering.', 'Full-time', 'Senior Level', 2200000, 3400000, 'Mumbai', 'Evergreen Systems', 2, 15, 'search.png'],
  ['HR Operations Coordinator', 'People Operations', 'Coordinate candidate scheduling, maintain accurate records, and improve repeatable hiring operations.', 'Full-time', 'Entry Level', 450000, 700000, 'Bengaluru', 'OpenLeaf Learning', 5, 16, 'promotion.png'],
  ['Business Development Associate', 'Sales', 'Research prospective customers, qualify opportunities, and support a consultative sales process.', 'Full-time', 'Entry Level', 500000, 850000, 'Chennai', 'Harbor Mobile', 13, 17, 'job-offer.png'],
  ['Machine Learning Engineer', 'Machine Learning', 'Build production ML pipelines, evaluate models, and partner with platform teams on deployment.', 'Full-time', 'Senior Level', 2400000, 3800000, 'Hyderabad', 'MetricWorks', 9, 18, 'posting.png'],
  ['Graphic Design Assistant', 'Visual Design', 'Prepare campaign assets, maintain brand consistency, and collaborate on digital design requests.', 'Part-time', 'Student / Intern', 300000, 480000, 'Mysuru', 'BrightPath Labs', 3, 19, 'search.png'],
  ['Engineering Team Lead', 'Engineering Leadership', 'Lead a small product engineering team, guide technical decisions, and support reliable delivery.', 'Full-time', 'Lead / Manager', 2800000, 4200000, 'Bengaluru', 'Northstar Digital', 16, 20, 'promotion.png']
];

async function seedJobs() {
  let publisher = await User.findOne({ name: 'sample-employer-seed' });
  if (!publisher) {
    publisher = await User.create({
      name: 'sample-employer-seed',
      company: 'Sample Employer',
      role: 'recruiter',
      passwordHash: await bcrypt.hash(crypto.randomBytes(48).toString('hex'), 12)
    });
  }

  const now = Date.now();
  await Job.bulkWrite(opportunities.map((job, index) => {
    const [title, role, description, type, seniorityLevel, salaryMin, salaryMax, location, companyName, deadlineDays, ageDays, icon] = job;
    const record = {
      seedKey: `default-job-${String(index + 1).padStart(2, '0')}`,
      title, role, description, type, seniorityLevel, salaryMin, salaryMax,
      salaryCurrency: 'INR', location, companyName, postedBy: publisher._id,
      deadline: new Date(now + deadlineDays * 86400000),
      createdAt: new Date(now - ageDays * 86400000),
      icon: `icons/resized-${icon}`,
      isOpen: true
    };
    return { updateOne: { filter: { seedKey: record.seedKey }, update: { $setOnInsert: record }, upsert: true } };
  }));
}

module.exports = seedJobs;
