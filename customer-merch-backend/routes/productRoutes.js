const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Endpoint Produk Public (Tidak Perlu Auth Token)
router.get('/home', productController.getHomeProducts);
router.get('/', productController.getAllProducts);
router.get('/stores', productController.getStores);
router.get('/:id', productController.getProductById);

router.get('/:id', productController.getProductDetail);
router.get('/:id/reviews', productController.getProductReviews);

module.exports = router;