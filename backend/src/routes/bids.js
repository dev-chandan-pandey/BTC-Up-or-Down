// const express = require('express');
// const router = express.Router();
// const { authMiddleware } = require('../middlewares/authMiddleware');
// const bidController = require('../controllers/bidController');

// router.use(authMiddleware);

// router.post('/', bidController.createBid);
// router.get('/', bidController.listBids);
// router.get('/:id', bidController.getBid);

// module.exports = router;
// routes/bids.js
const express = require('express');
const { body, query } = require('express-validator');
const { createBid, listBids, getBid } = require('../controllers/bidController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');

const router = express.Router();

router.post(
  '/',
 authMiddleware ,
  [
    body('amount').isInt({ min: 100, max: 1000000 }).withMessage('Amount 100–1,000,000 cents'),
    body('direction').isIn(['UP', 'DOWN']).withMessage('Direction must be UP or DOWN')
  ],
  validate,
 createBid
);

router.get(
  '/',
 authMiddleware ,
  [
    query('status').optional().isIn(['OPEN', 'WON', 'LOST', 'PENDING_SETTLEMENT']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  validate,
  listBids
);
router.get('/:id', getBid);
module.exports = router;
