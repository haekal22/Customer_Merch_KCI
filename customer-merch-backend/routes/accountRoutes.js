const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// Endpoint Ringkasan & Update Akun
router.get('/summary', accountController.getAccountSummary);
router.put('/profile', accountController.updateAccountProfile);
router.post('/logout', accountController.logout);

module.exports = router;