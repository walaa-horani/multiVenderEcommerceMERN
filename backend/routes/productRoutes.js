const express = require('express');
const router = express.Router();
const { getProducts, getProductById, getVendorProducts, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.route('/')
    .get(getProducts)
    .post(protect, authorize('vendor'), createProduct);

router.route('/myproducts')
    .get(protect, authorize('vendor'), getVendorProducts);

router.route('/:id')
    .get(getProductById)
    .put(protect, authorize('vendor', 'admin'), updateProduct)
    .delete(protect, authorize('vendor', 'admin'), deleteProduct);

module.exports = router;
