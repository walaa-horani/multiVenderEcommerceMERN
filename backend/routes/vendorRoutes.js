const express = require('express');
const router = express.Router();
const { getAllVendors, getVendorById, updateVendor, deleteVendor, getMyVendorProfile } = require('../controllers/vendorController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Vendor's own profile
router.get('/me', protect, authorize('vendor'), getMyVendorProfile);

// Admin vendor management
router.route('/')
    .get(protect, authorize('admin'), getAllVendors);

router.route('/:id')
    .get(getVendorById)
    .put(protect, authorize('vendor', 'admin'), updateVendor)
    .delete(protect, authorize('admin'), deleteVendor);

module.exports = router;
