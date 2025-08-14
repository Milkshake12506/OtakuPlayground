const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

console.log('OAuth env check:',
  (process.env.GOOGLE_CLIENT_ID || '').slice(0,12),
  process.env.GOOGLE_CALLBACK_URL
);

passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    scope: ['profile', 'email'] // ← Thêm dòng này
  },
  async (_at, _rt, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value || null;
      let user = await User.findOne({ googleId: profile.id });
      if (!user && email) user = await User.findOne({ email });
      if (!user) {
        user = await User.create({
          googleId: profile.id,
          email,
          displayName: profile.displayName,
          avatar: profile.photos?.[0]?.value
        });
      } else if (!user.googleId) {
        user.googleId = profile.id;
        await user.save();
      }
      // chỉ giữ thông tin gọn vào session
      return done(null, { 
        id: user.id, 
        displayName: user.displayName, 
        email: user.email, 
        avatar: user.avatar, 
        role: user.role 
      });
    } catch (e) {
      return done(e);
    }
  }
));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

module.exports = passport;