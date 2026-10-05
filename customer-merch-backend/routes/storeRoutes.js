const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');

// Public Route untuk Temukan Outlet Terdekat
router.get('/', storeController.getStores);

module.exports = router;