const express = require('express');
const router = express.Router();
const { addOrderItems, getMyOrders, getOrders, updateOrderStatus, getOrderById } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.route('/')
    .post(protect, authorize('customer'), addOrderItems)
    .get(protect, authorize('admin', 'vendor'), getOrders);

router.route('/myorders').get(protect, getMyOrders);

router.route('/:id')
    .get(protect, getOrderById);

router.route('/:id/status').put(protect, authorize('admin', 'vendor'), updateOrderStatus);

module.exports = router;
