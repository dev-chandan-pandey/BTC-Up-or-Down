// const express = require('express');
// const router = express.Router();
// const { signup, login, me } = require('../controllers/authController');
// const { authMiddleware } = require('../middlewares/authMiddleware');

// router.post('/signup', signup);
// router.post('/login', login);
// router.get('/me', authMiddleware, me);

// module.exports = router;
// routes/auth.js
const express = require('express');
const { body } = require('express-validator');
const { signup, login, me } = require('../controllers/authController');
const validate = require('../middlewares/validate');
const { authMiddleware } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post(
  '/signup',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password >=6 chars required')
  ],
  validate,
  signup
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required')
  ],
  validate,
  login
);

router.get('/me', authMiddleware, me);

module.exports = router;
