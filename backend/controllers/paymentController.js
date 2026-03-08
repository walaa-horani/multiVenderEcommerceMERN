const Stripe = require('stripe');
const Order = require('../models/Order');
const Payment = require('../models/Payment');

// Lazy Stripe init — only when key is available
let stripe = null;
const getStripe = () => {
    if (!stripe && process.env.STRIPE_SECRET_KEY) {
        stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    }
    return stripe;
};

// @desc    Create Stripe checkout session
// @route   POST /api/payments/create-checkout-session
// @access  Private/Customer
const createCheckoutSession = async (req, res) => {
    if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ message: 'Stripe is not configured. Add STRIPE_SECRET_KEY to .env' });
    }

    const { orderId } = req.body;

    try {
        const order = await Order.findById(orderId).populate('products.productId', 'name price images');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const lineItems = order.products.map((item) => ({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: item.productId?.name || 'Product',
                    images: item.productId?.images?.slice(0, 1) || [],
                },
                unit_amount: Math.round(item.price * 100),
            },
            quantity: item.quantity,
        }));

        const session = await getStripe().checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders?success=true`,
            cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders?cancelled=true`,
            metadata: {
                orderId: order._id.toString(),
                userId: req.user._id.toString(),
            },
        });

        // Create payment record
        await Payment.create({
            orderId: order._id,
            userId: req.user._id,
            amount: order.totalAmount,
            stripeSessionId: session.id,
            status: 'pending',
        });

        res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Payment session creation failed' });
    }
};

// @desc    Handle Stripe webhook
// @route   POST /api/payments/webhook
// @access  Public (Stripe sends this)
const handleWebhook = async (req, res) => {
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
        return res.status(500).json({ message: 'Stripe webhook not configured' });
    }

    const sig = req.headers['stripe-signature'];

    let event;
    try {
        event = getStripe().webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).json({ message: `Webhook Error: ${err.message}` });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        try {
            // Update payment status
            await Payment.findOneAndUpdate(
                { stripeSessionId: session.id },
                {
                    status: 'completed',
                    stripePaymentIntentId: session.payment_intent,
                }
            );

            // Update order status to processing
            if (session.metadata?.orderId) {
                await Order.findByIdAndUpdate(session.metadata.orderId, { status: 'processing' });
            }
        } catch (error) {
            console.error('Error processing webhook:', error);
        }
    }

    if (event.type === 'payment_intent.payment_failed') {
        const paymentIntent = event.data.object;

        try {
            await Payment.findOneAndUpdate(
                { stripePaymentIntentId: paymentIntent.id },
                { status: 'failed' }
            );
        } catch (error) {
            console.error('Error processing failed payment webhook:', error);
        }
    }

    res.json({ received: true });
};

// @desc    Get all payments (admin)
// @route   GET /api/payments
// @access  Private/Admin
const getAllPayments = async (req, res) => {
    try {
        const payments = await Payment.find({})
            .populate('orderId', 'totalAmount status createdAt')
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get vendor earnings
// @route   GET /api/payments/earnings
// @access  Private/Vendor
const getVendorEarnings = async (req, res) => {
    try {
        const Vendor = require('../models/Vendor');
        const Product = require('../models/Product');

        const vendor = await Vendor.findOne({ userId: req.user._id });
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor profile not found' });
        }

        // Get vendor's products
        const vendorProducts = await Product.find({ vendorId: vendor._id }).select('_id');
        const productIds = vendorProducts.map(p => p._id);

        // Find completed orders with vendor's products
        const orders = await Order.find({
            'products.productId': { $in: productIds },
            status: { $in: ['processing', 'shipped', 'delivered'] },
        }).populate('products.productId', 'name price vendorId');

        // Calculate earnings from vendor's products only
        let totalEarnings = 0;
        let pendingEarnings = 0;
        let paidEarnings = 0;

        orders.forEach(order => {
            order.products.forEach(item => {
                if (productIds.some(id => id.toString() === item.productId?._id?.toString())) {
                    const amount = item.price * item.quantity;
                    totalEarnings += amount;
                    if (order.status === 'delivered') {
                        paidEarnings += amount;
                    } else {
                        pendingEarnings += amount;
                    }
                }
            });
        });

        res.json({
            totalEarnings,
            pendingEarnings,
            paidEarnings,
            orderCount: orders.length,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { createCheckoutSession, handleWebhook, getAllPayments, getVendorEarnings };
