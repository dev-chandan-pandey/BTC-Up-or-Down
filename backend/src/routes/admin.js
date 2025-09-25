const express = require('express');
const router = express.Router();
const { authMiddleware, adminOnly } = require('../middlewares/authMiddleware');
const adminController = require('../controllers/adminController');

router.get('/pending-bids', authMiddleware, adminOnly, adminController.listPendingBids);
router.post('/settle/:id', authMiddleware, adminOnly, adminController.manualSettle);

module.exports = router;
