const express = require('express');
const cors = require('cors');
const rateLimit = require('./middlewares/rateLimit');
const authRoutes = require('./routes/auth');
const bidRoutes = require('./routes/bids');
const adminRoutes = require('./routes/admin');

const app = express();
app.use(express.json());

const ORIGIN = process.env.FRONTEND_ORIGIN || 'https://btc-up-or-down.onrender.com';
app.use(cors({ origin: ORIGIN }));

app.use('/auth', rateLimit.loginLimiter, authRoutes);
app.use('/bids', rateLimit.bidsLimiter, bidRoutes);
app.use('/admin', adminRoutes);

app.get('/', (req, res) => res.json({ ok: true }));

module.exports = app;
