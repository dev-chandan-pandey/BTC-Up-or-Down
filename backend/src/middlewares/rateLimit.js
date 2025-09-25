const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  message: { error: 'Too many login attempts, try later.' }
});

const bidsLimiter = rateLimit({
  windowMs: 10_000,
  max: 20,
  message: { error: 'Too many requests.' }
});

module.exports = { loginLimiter, bidsLimiter };
