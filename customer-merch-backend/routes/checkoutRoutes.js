const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');
const addressController = require('../controllers/addressController');
const authMiddleware = require('../middleware/authMiddleware');

// Semua Endpoint Checkout Wajib Autentikasi Customer (Bearer Token)
router.use(authMiddleware);

// 1. Endpoint Informasi Checkout (Alamat & Item Keranjang)
router.get('/info', checkoutController.getCheckoutInfo);

// 2. Endpoint Hitung Ongkir Dinamis (Integrasi Komerce API)
router.post('/shipping-cost', checkoutController.calculateShipping);

// 3. Endpoint Buat Pesanan / Place Order
router.post('/create-order', checkoutController.createOrder);
router.post('/', checkoutController.createOrder); // REST standard alias

// 4. Endpoint Simulasi Pembayaran Demo (Ubah status order ke 'paid')
router.post('/orders/:id/pay-demo', checkoutController.payDemoOrder);

// 5. Endpoint Manajemen Alamat Pengiriman
router.get('/search-destination', addressController.searchDestination);
router.get('/addresses', addressController.getAddresses);
router.post('/addresses', addressController.addAddress);

module.exports = router;