module.exports = function ensureAdmin(req, res, next) {
  if (req.isAuthenticated?.() && req.user?.role === 'admin') return next();
  if (!req.isAuthenticated?.()) return res.status(401).json({ error: 'Unauthorized' });
  return res.status(403).json({ error: 'Forbidden' });
};
