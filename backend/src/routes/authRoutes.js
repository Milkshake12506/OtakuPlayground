const express = require('express');
const passport = require('passport');
const router = express.Router();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/fail' }),
  (req, res) => res.redirect('/auth/success')
);

router.get('/success', (req, res) => {
  if (!req.user) return res.redirect('/auth/fail');
  res.json({ message: 'Login success', user: req.user });
});

router.get('/fail', (_req, res) => res.status(401).json({ error: 'Login failed' }));

router.post('/logout', (req, res) => {
  req.logout(() => req.session.destroy(() => res.json({ message: 'Logged out' })));
});

module.exports = router;
