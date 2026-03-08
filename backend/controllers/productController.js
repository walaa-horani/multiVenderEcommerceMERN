const Product = require('../models/Product');
const Vendor = require('../models/Vendor');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
    try {
        const products = await Product.find({}).populate('vendorId', 'storeName');
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('vendorId', 'storeName');

        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get logged in vendor's products
// @route   GET /api/products/myproducts
// @access  Private/Vendor
const getVendorProducts = async (req, res) => {
    try {
        const vendor = await Vendor.findOne({ userId: req.user._id });
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor profile not found' });
        }
        const products = await Product.find({ vendorId: vendor._id }).populate('vendorId', 'storeName');
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Vendor
const createProduct = async (req, res) => {
    try {
        const vendor = await Vendor.findOne({ userId: req.user._id });

        if (!vendor) {
            return res.status(404).json({ message: 'Vendor profile not found' });
        }

        const { name, description, price, stock, category, images } = req.body;

        const product = new Product({
            vendorId: vendor._id,
            name,
            description,
            price,
            stock,
            category,
            images,
        });

        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Vendor/Admin
const updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Role check: Vendor can only update own products
        if (req.user.role === 'vendor') {
            const vendor = await Vendor.findOne({ userId: req.user._id });
            if (!vendor || product.vendorId.toString() !== vendor._id.toString()) {
                return res.status(403).json({ message: 'Not authorized to update this product' });
            }
        }

        // Admin can bypass the above check and update any product

        const { name, description, price, stock, category, images } = req.body;
        product.name = name || product.name;
        product.description = description || product.description;
        product.price = price || product.price;
        product.stock = stock || product.stock;
        product.category = category || product.category;
        product.images = images || product.images;

        const updatedProduct = await product.save();
        res.json(updatedProduct);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Vendor/Admin
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Role check
        if (req.user.role === 'vendor') {
            const vendor = await Vendor.findOne({ userId: req.user._id });
            if (!vendor || product.vendorId.toString() !== vendor._id.toString()) {
                return res.status(403).json({ message: 'Not authorized to delete this product' });
            }
        }

        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: 'Product removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getProducts, getProductById, getVendorProducts, createProduct, updateProduct, deleteProduct };
