const express = require('express');
const router = express.Router();
const { createCheckoutSession, handleWebhook, getAllPayments, getVendorEarnings } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Stripe webhook (must use raw body, so this needs special handling in index.js)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Checkout
router.post('/create-checkout-session', protect, authorize('customer'), createCheckoutSession);

// Admin payment management
router.get('/', protect, authorize('admin'), getAllPayments);

// Vendor earnings
router.get('/earnings', protect, authorize('vendor'), getVendorEarnings);

module.exports = router;
