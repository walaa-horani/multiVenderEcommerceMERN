const Cart = require('../models/Cart');

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res) => {
    try {
        let cart = await Cart.findOne({ userId: req.user._id }).populate('products.productId', 'name price images category stock vendorId');
        if (!cart) {
            cart = await Cart.create({ userId: req.user._id, products: [] });
        }
        res.json(cart);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
const addToCart = async (req, res) => {
    const { productId, quantity } = req.body;

    try {
        let cart = await Cart.findOne({ userId: req.user._id });
        if (!cart) {
            cart = await Cart.create({ userId: req.user._id, products: [] });
        }

        const existingItem = cart.products.find(
            (item) => item.productId.toString() === productId
        );

        if (existingItem) {
            existingItem.quantity += quantity || 1;
        } else {
            cart.products.push({ productId, quantity: quantity || 1 });
        }

        cart.updatedAt = Date.now();
        await cart.save();

        // Return populated cart
        cart = await Cart.findById(cart._id).populate('products.productId', 'name price images category stock vendorId');
        res.json(cart);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/:productId
// @access  Private
const updateCartItem = async (req, res) => {
    const { quantity } = req.body;

    try {
        const cart = await Cart.findOne({ userId: req.user._id });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const item = cart.products.find(
            (item) => item.productId.toString() === req.params.productId
        );

        if (!item) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        if (quantity <= 0) {
            cart.products = cart.products.filter(
                (item) => item.productId.toString() !== req.params.productId
            );
        } else {
            item.quantity = quantity;
        }

        cart.updatedAt = Date.now();
        await cart.save();

        const updatedCart = await Cart.findById(cart._id).populate('products.productId', 'name price images category stock vendorId');
        res.json(updatedCart);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:productId
// @access  Private
const removeFromCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user._id });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        cart.products = cart.products.filter(
            (item) => item.productId.toString() !== req.params.productId
        );

        cart.updatedAt = Date.now();
        await cart.save();

        const updatedCart = await Cart.findById(cart._id).populate('products.productId', 'name price images category stock vendorId');
        res.json(updatedCart);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Clear entire cart
// @route   DELETE /api/cart
// @access  Private
const clearCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user._id });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        cart.products = [];
        cart.updatedAt = Date.now();
        await cart.save();

        res.json({ message: 'Cart cleared', cart });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };
