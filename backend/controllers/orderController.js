const Order = require('../models/Order');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Product = require('../models/Product');
const {
    sendOrderCreatedEmails,
    sendOrderCancelledEmails,
    sendOrderStatusUpdateEmail,
} = require('../services/emailService');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private/Customer
const addOrderItems = async (req, res) => {
    const { products, totalAmount, shippingAddress } = req.body;

    if (!products || products.length === 0) {
        return res.status(400).json({ message: 'No order items' });
    }

    const reservedProducts = [];

    try {
        // 1. Atomically check and reserve stock for each product
        for (const item of products) {
            // Find the product and decrement stock only if it has enough stock
            const product = await Product.findOneAndUpdate(
                { _id: item.productId, stock: { $gte: item.quantity } },
                { $inc: { stock: -item.quantity } },
                { new: true } // Returns the modified document
            );

            if (!product) {
                // Not enough stock or product not found
                // Rollback previously reserved products
                for (const reserved of reservedProducts) {
                    await Product.updateOne(
                        { _id: reserved.productId },
                        { $inc: { stock: reserved.quantity } }
                    );
                }

                // Fetch product name for a better error message, if it exists
                const failedProduct = await Product.findById(item.productId);
                const errorMessage = failedProduct
                    ? `Not enough stock for ${failedProduct.name}`
                    : 'Product not found or out of stock';

                return res.status(400).json({ message: errorMessage });
            }

            // Successfully reserved
            reservedProducts.push({ productId: item.productId, quantity: item.quantity });
        }

        // 2. Create the order since stock was successfully reserved
        const order = new Order({
            userId: req.user._id,
            products,
            totalAmount,
            shippingAddress,
        });

        const createdOrder = await order.save();

        // Populate for email
        const populatedOrder = await Order.findById(createdOrder._id)
            .populate('products.productId', 'name price images vendorId')
            .populate('userId', 'name email');

        // Send email to customer
        const customerEmail = req.user.email || populatedOrder.userId?.email;

        // Find vendor emails for products in this order
        const vendorEmails = new Set();
        for (const item of populatedOrder.products) {
            if (item.productId?.vendorId) {
                const vendor = await Vendor.findById(item.productId.vendorId).populate('userId', 'email');
                if (vendor?.userId?.email) {
                    vendorEmails.add(vendor.userId.email);
                }
            }
        }

        // Send emails (non-blocking)
        if (customerEmail) {
            for (const vendorEmail of vendorEmails) {
                sendOrderCreatedEmails(populatedOrder, customerEmail, vendorEmail).catch(console.error);
            }
            if (vendorEmails.size === 0) {
                sendOrderCreatedEmails(populatedOrder, customerEmail, null).catch(console.error);
            }
        }

        res.status(201).json(createdOrder);
    } catch (error) {
        console.error(error);
        // Rollback reserved products if order creation or something else failed unexpectedly
        for (const reserved of reservedProducts) {
            await Product.updateOne(
                { _id: reserved.productId },
                { $inc: { stock: reserved.quantity } }
            ).catch(console.error); // catch error in rollback to prevent crash
        }
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get user orders (customer sees their own)
// @route   GET /api/orders/myorders
// @access  Private/Customer
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user._id })
            .populate('products.productId', 'name price images category vendorId')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all orders (admin sees all, vendor sees their product orders)
// @route   GET /api/orders
// @access  Private/Admin/Vendor
const getOrders = async (req, res) => {
    try {
        if (req.user.role === 'admin') {
            const orders = await Order.find({})
                .populate('userId', 'name email')
                .populate('products.productId', 'name price images category vendorId')
                .sort({ createdAt: -1 });
            return res.json(orders);
        }

        // Vendor: find their vendor profile, then find orders containing their products
        if (req.user.role === 'vendor') {
            const vendor = await Vendor.findOne({ userId: req.user._id });
            if (!vendor) {
                return res.status(404).json({ message: 'Vendor profile not found' });
            }

            // Find products belonging to this vendor
            const vendorProducts = await Product.find({ vendorId: vendor._id }).select('_id');
            const productIds = vendorProducts.map(p => p._id);

            // Find orders containing these products
            const orders = await Order.find({ 'products.productId': { $in: productIds } })
                .populate('userId', 'name email')
                .populate('products.productId', 'name price images category vendorId')
                .sort({ createdAt: -1 });

            return res.json(orders);
        }

        res.status(403).json({ message: 'Not authorized' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin/Vendor
const updateOrderStatus = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('products.productId', 'name price images vendorId')
            .populate('userId', 'name email');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const previousStatus = order.status;
        order.status = req.body.status || order.status;
        const updatedOrder = await order.save();

        // Send email notification on status change
        if (previousStatus !== updatedOrder.status && order.userId?.email) {
            if (updatedOrder.status === 'cancelled') {
                // Find vendor email
                let vendorEmail = null;
                for (const item of order.products) {
                    if (item.productId?.vendorId) {
                        const vendor = await Vendor.findById(item.productId.vendorId).populate('userId', 'email');
                        if (vendor?.userId?.email) {
                            vendorEmail = vendor.userId.email;
                            break;
                        }
                    }
                }
                sendOrderCancelledEmails(updatedOrder, order.userId.email, vendorEmail).catch(console.error);
            } else {
                sendOrderStatusUpdateEmail(updatedOrder, order.userId.email).catch(console.error);
            }
        }

        res.json(updatedOrder);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('userId', 'name email')
            .populate('products.productId', 'name price images category vendorId');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Customers can only see their own orders
        if (req.user.role === 'customer' && order.userId._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to view this order' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { addOrderItems, getMyOrders, getOrders, updateOrderStatus, getOrderById };
