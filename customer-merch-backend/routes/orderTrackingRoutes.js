const express = require('express');
const router = express.Router();
const orderTrackingController = require('../controllers/orderTrackingController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// Endpoint Riwayat & Lacak Pesanan
router.get('/', orderTrackingController.getMyOrders);
router.get('/:order_id', orderTrackingController.trackOrder);

module.exports = router;