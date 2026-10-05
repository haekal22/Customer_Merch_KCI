const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');
const addressController = require('../controllers/addressController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// Endpoint Checkout & Order
router.get('/info', checkoutController.getCheckoutInfo);
router.post('/create-order', checkoutController.createOrder);

// Endpoint Alamat Pengiriman
router.get('/addresses', addressController.getAddresses);
router.post('/addresses', addressController.addAddress);

module.exports = router;