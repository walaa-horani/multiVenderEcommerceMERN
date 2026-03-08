const express = require('express');
const router = express.Router();
const { registerUser, loginUser, logoutUser, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/reset-password', protect, resetPassword);

module.exports = router;
