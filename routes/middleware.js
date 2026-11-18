function requireRole(role) {
  return (req, res, next) => {
    if (!req.session.user) return res.redirect(`/login?redirect=${encodeURIComponent(req.originalUrl)}`);
    if (role && req.session.user.role !== role) return res.status(403).send('You do not have permission to access this page.');
    next();
  };
}

module.exports = { requireRole };
