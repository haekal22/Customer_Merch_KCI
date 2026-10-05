const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// Detail Pembayaran & Mutasi Check
router.get('/:order_id', paymentController.getPaymentDetail);
router.post('/:order_id/check-status', paymentController.checkPaymentStatus);

module.exports = router;