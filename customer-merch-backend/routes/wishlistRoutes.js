const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const authMiddleware = require('../middleware/authMiddleware');

// Semua Rute Wishlist Wajib Autentikasi Customer
router.use(authMiddleware);

router.get('/', wishlistController.getWishlist);
router.post('/toggle', wishlistController.toggleWishlist);

module.exports = router;

