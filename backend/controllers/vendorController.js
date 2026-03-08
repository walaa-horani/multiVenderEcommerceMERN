const Vendor = require('../models/Vendor');
const User = require('../models/User');
const Product = require('../models/Product');

// @desc    Get all vendors
// @route   GET /api/vendors
// @access  Private/Admin
const getAllVendors = async (req, res) => {
    try {
        const vendors = await Vendor.find({}).populate('userId', 'name email role createdAt');
        res.json(vendors);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get vendor by ID
// @route   GET /api/vendors/:id
// @access  Public
const getVendorById = async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.params.id).populate('userId', 'name email');
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        // Also get vendor's products
        const products = await Product.find({ vendorId: vendor._id });

        res.json({ vendor, products });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update vendor profile
// @route   PUT /api/vendors/:id
// @access  Private/Vendor (own) or Admin
const updateVendor = async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.params.id);
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        // Vendors can only update their own profile
        if (req.user.role === 'vendor' && vendor.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this vendor' });
        }

        vendor.storeName = req.body.storeName || vendor.storeName;
        vendor.storeDescription = req.body.storeDescription || vendor.storeDescription;
        vendor.storeLogo = req.body.storeLogo || vendor.storeLogo;

        const updatedVendor = await vendor.save();
        res.json(updatedVendor);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete vendor
// @route   DELETE /api/vendors/:id
// @access  Private/Admin
const deleteVendor = async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.params.id);
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        // Also reset user role to customer
        await User.findByIdAndUpdate(vendor.userId, { role: 'customer' });

        // Delete vendor's products
        await Product.deleteMany({ vendorId: vendor._id });

        await Vendor.findByIdAndDelete(req.params.id);
        res.json({ message: 'Vendor removed and products deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get current vendor profile (for logged-in vendor)
// @route   GET /api/vendors/me
// @access  Private/Vendor
const getMyVendorProfile = async (req, res) => {
    try {
        const vendor = await Vendor.findOne({ userId: req.user._id });
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor profile not found' });
        }
        res.json(vendor);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getAllVendors, getVendorById, updateVendor, deleteVendor, getMyVendorProfile };
