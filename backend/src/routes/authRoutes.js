const express = require('express');
const passport = require('passport');
const router = express.Router();

/** Lưu URL trước khi đi OAuth để quay lại đúng trang */
router.get('/google',
  (req, _res, next) => { req.session.returnTo = req.get('Referer') || '/'; next(); },
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

/** Google callback → login thành công thì redirect, thất bại về /login */
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    const to = req.session.returnTo || '/';
    delete req.session.returnTo;
    res.redirect(to);
  }
);

/** FE gọi để biết user hiện tại */
router.get('/me', (req, res) => {
  if (!req.user) return res.json(null);
  const u = req.user;
  res.json({
    id: u.id || u._id,
    name: u.name || u.displayName,
    email: u.email,
    avatar: u.avatar,
    role: u.role
  });
});

/** Logout */
router.post('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({ message: 'Logged out' });
    });
  });
});

module.exports = router;
