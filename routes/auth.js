// Purpose: Register users, verify password hashes, manage login sessions, and handle logout.
const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const router = express.Router();

function safeRedirect(value) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : '/';
}

router.get('/login', (req, res) => res.render('login', { error: null, message: req.query.message || null, redirect: safeRedirect(req.query.redirect) }));
router.get('/signup', (req, res) => res.render('signup', { error: null, success: null }));

router.post('/signup', async (req, res, next) => {
  const name = String(req.body.username || '').trim();
  const password = String(req.body.password || '');
  const role = req.body.role === 'recruiter' ? 'recruiter' : 'applicant';
  const company = role === 'recruiter' ? String(req.body.company || '').trim() : '';
  if (!name || password.length < 8 || (role === 'recruiter' && !company)) {
    return res.status(400).render('signup', { error: 'Enter a username, a password of at least 8 characters, and a company for recruiter accounts.', success: null });
  }
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    await User.create({ name, passwordHash, role, company });
    res.render('signup', { success: 'Account created. You can now log in.', error: null });
  } catch (err) {
    if (err.code === 11000) return res.status(409).render('signup', { error: 'That username is already registered.', success: null });
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '');
    const account = await User.findOne({ name: username });
    if (!account || !(await bcrypt.compare(password, account.passwordHash))) {
      return res.status(401).render('login', { error: 'Username or password is incorrect.', message: null, redirect: safeRedirect(req.body.redirect) });
    }
    req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.user = { _id: account._id, name: account.name, role: account.role, company: account.company, email: account.email };
      res.redirect(safeRedirect(req.body.redirect));
    });
  } catch (err) { next(err); }
});

router.get('/logout', (req, res, next) => {
  if (!req.session) return res.redirect('/');
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('jobfinder.sid');
    res.redirect('/login?message=loggedout');
  });
});

module.exports = router;
