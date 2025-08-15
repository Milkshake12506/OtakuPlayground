require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const passport = require('./config/passport');
const authRoutes = require('./routes/authRoutes');
const { connectDB, mongoose } = require('./config/db');
const genreRoutes = require('./routes/genreRoutes');
const mangaRoutes  = require('./routes/mangaRoutes')
const seriesRoutes = require('./routes/seriesRoutes');
const path = require('path');

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
  const states = ['disconnected','connected','connecting','disconnecting','uninitialized'];
  res.json({
    ok: true,
    mongoState: states[mongoose.connection.readyState] ?? mongoose.connection.readyState
  });
});

app.get('/debug-oauth', (_req, res) => {
  res.json({
    clientIdStart: (process.env.GOOGLE_CLIENT_ID || '').slice(0, 20),
    callback: process.env.GOOGLE_CALLBACK_URL
  });
});

app.use('/auth', authRoutes);
app.use('/api/genres', genreRoutes);
app.use('/api', require('./routes/mangaRoutes'));
app.use('/api/series', seriesRoutes);
app.use('/static', express.static(path.join(__dirname, '../../uploads')));
app.use('/admin', express.static(path.join(__dirname, '../../frontend/admin/public')));
app.use('/', express.static(path.join(__dirname, '../../frontend/HomePage')));


// CHỈ start server SAU KHI DB OK
const PORT = process.env.PORT || 3000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
});
