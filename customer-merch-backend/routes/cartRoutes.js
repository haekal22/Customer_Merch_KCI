const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const authMiddleware = require('../middleware/authMiddleware');

// Semua Rute Keranjang Wajib Autentikasi Customer (Bearer Token)
router.use(authMiddleware);

router.get('/', cartController.getCart);
router.post('/add', cartController.addToCart);
router.put('/:cart_id', cartController.updateCartQuantity);
router.delete('/:cart_id', cartController.removeFromCart);

module.exports = router;