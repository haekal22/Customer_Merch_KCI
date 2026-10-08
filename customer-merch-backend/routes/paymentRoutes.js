const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');

// 1. PUBLIC ROUTE (Callback Finpay)
// Dipanggil oleh server Finpay saat pembayaran sukses
if (typeof paymentController.handleFinpayCallback === 'function') {
  router.post('/finpay-callback', paymentController.handleFinpayCallback);
}

// 2. PROTECTED ROUTES (Akses Customer di Frontend)
router.get('/:order_id', authMiddleware, paymentController.getPaymentDetail);
router.post('/:order_id/check-status', authMiddleware, paymentController.checkPaymentStatus);

module.exports = router;