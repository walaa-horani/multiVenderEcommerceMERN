const express = require('express');
const router = express.Router();
const { getUserProfile, updateUserProfile, getAllUsers, updateUserRole, deleteUser, inviteAdmin, registerAdmin } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Public admin registration route
router.route('/register-admin').post(registerAdmin);

// User profile routes
router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

// Admin user management routes
router.route('/')
    .get(protect, authorize('admin'), getAllUsers);

router.route('/invite-admin')
    .post(protect, authorize('admin'), inviteAdmin);

router.route('/:id/role')
    .put(protect, authorize('admin'), updateUserRole);

router.route('/:id')
    .delete(protect, authorize('admin'), deleteUser);

module.exports = router;
