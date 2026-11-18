// Purpose: Configure the Express application and start it after MongoDB connects and sample jobs are seeded.
const express = require('express');
const path = require('path');
const session = require('express-session');
const multer = require('multer');
const connectDB = require('./models/db');
const seedJobs = require('./models/seedJobs');

const app = express();
const port = Number(process.env.PORT) || 4000;
const sessionSecret = process.env.SESSION_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'development-only-change-me');
if (!sessionSecret) throw new Error('Set SESSION_SECRET before running in production.');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(session({
  name: 'jobfinder.sid',
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24
  }
}));

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

app.use('/', require('./routes/main'));
app.use('/', require('./routes/auth'));
app.use('/', require('./routes/job'));
app.use('/', require('./routes/application'));
app.use('/', require('./routes/contact'));
app.use('/', require('./routes/recruiter'));

app.use((req, res) => res.status(404).send('Page not found'));
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  const status = err.status || (err instanceof multer.MulterError ? 400 : 500);
  res.status(status).send(status < 500 ? err.message : 'Something went wrong.');
});

connectDB().then(() => {
  return seedJobs();
}).then(() => {
  app.listen(port, () => console.log(`Online Job Finder listening on http://localhost:${port}`));
}).catch((err) => {
  console.error('Could not connect to MongoDB:', err.message);
  process.exitCode = 1;
});
