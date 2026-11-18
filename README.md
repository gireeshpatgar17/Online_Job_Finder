# Online Job Finder

A server-rendered job board for applicants and recruiters, built with Express, EJS, MongoDB, and Mongoose.

## Features

- Register and log in with applicant or recruiter roles.
- Browse job listings and open a job detail page.
- Submit applications with education, experience, skills, resume, and certificates.
- Let recruiters publish jobs with employment type, seniority, annual INR salary range, deadline, and generated card icon.
- Send job-specific questions to recruiters and view, mark read, or delete those messages from the recruiter dashboard.
- Applicants can review every submitted application and its current recruiter-managed status.
- Applicants can submit only one application per job; repeat attempts show a link to their application tracker.
- Recruiters can edit, close/reopen, and delete only their own job posts; they can review applications, update application status, and download applicant attachments.
- Search and filter active listings by employment type, seniority, and annual salary. Facet counts reflect the database results and current filters.
- Sort by newest, oldest, highest salary, or nearest deadline. Job results are paginated (10 per page).
- Seed 20 complete sample job listings on startup. Seed keys make this operation idempotent, so restarts do not create duplicates.

## Run locally

Requirements: Node.js 18 or newer and a MongoDB server.

```powershell
npm ci
$env:MONGODB_URI = "mongodb://127.0.0.1:27017/onlineJobFinder"
$env:SESSION_SECRET = "replace-this-with-a-long-random-secret"
npm start
```

Then open [http://localhost:4000](http://localhost:4000). The MongoDB URI defaults to the value shown above. Set `PORT` to use a different port. Set `SESSION_SECRET` before deployment; the built-in fallback is for local development only.

## Structure

```text
app.js                   Express setup, middleware, route registration, startup
models/                  Mongoose schemas, database connection, and seed data
routes/                  Authentication, job, application, contact, recruiter routes
views/                   EJS server-rendered pages
public/                  Browser JavaScript, shared CSS, and job card images
storage/uploads/         Private resume and certificate storage
```

Applications are associated with the selected job when submitted from that job's page. Uploaded documents are stored outside the public static directory; recruiter downloads are restricted to applications belonging to their own jobs. Job-specific messages are similarly scoped to their recruiter.

The 20 seeded listings use a system-owned sample recruiter account that cannot log in. Recruiters registered through the signup page manage only their own job posts. Deleting a job also deletes its applications, uploaded application files, and job messages.

The final version uses a new `onlineJobFinder` database by default and does not automatically migrate documents from the earlier `LoginDB` or `jobFinderDB` versions. Existing uploads from the source folders are not copied into this project.
