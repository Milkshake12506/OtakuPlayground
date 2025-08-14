require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const passport = require('./config/passport');
const authRoutes = require('./routes/authRoutes');
const { connectDB, mongoose } = require('./config/db');
const genreRoutes = require('./routes/genreRoutes');
const mangaRoutes  = require('./routes/mangaRoutes')

const app = express();

app.use(cookieParser());
app.use(express.json()); // nếu có POST/PUT body JSON

app.use(session({
  secret: process.env.SESSION_SECRET || 'secret', 
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

//route kiểm tra DB
app.get('/health', (_req, res) => {
  app.get('/debug-oauth', (_req, res) => {
  res.json({
    clientIdStart: (process.env.GOOGLE_CLIENT_ID || '').slice(0, 20),
    callback: process.env.GOOGLE_CALLBACK_URL
  });
});
  const states = ['disconnected','connected','connecting','disconnecting','uninitialized'];
  res.json({
    ok: true,
    mongoState: states[mongoose.connection.readyState] ?? mongoose.connection.readyState
  });
});

app.use('/auth', authRoutes);
app.use('/api/genres', genreRoutes);
app.use('/api/series', mangaRoutes);

// CHỈ start server SAU KHI DB OK
const PORT = process.env.PORT || 3000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
});
