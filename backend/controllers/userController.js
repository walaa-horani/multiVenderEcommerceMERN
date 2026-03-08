const User = require('../models/User');
const Vendor = require('../models/Vendor');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendAdminInvitationEmail } = require('../services/emailService');

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let vendorInfo = null;
        if (user.role === 'vendor') {
            vendorInfo = await Vendor.findOne({ userId: user._id });
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
            vendor: vendorInfo,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update current user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;

        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(req.body.password, salt);
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update user role
// @route   PUT /api/users/:id/role
// @access  Private/Admin
const updateUserRole = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { role } = req.body;
        if (!['customer', 'vendor', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        // If changing to vendor, create vendor profile if not exists
        if (role === 'vendor' && user.role !== 'vendor') {
            const existingVendor = await Vendor.findOne({ userId: user._id });
            if (!existingVendor) {
                await Vendor.create({
                    userId: user._id,
                    storeName: `${user.name}'s Store`,
                });
            }
        }

        user.role = role;
        await user.save();

        res.json({ message: 'User role updated', user: { _id: user._id, name: user.name, role: user.role } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Don't allow deleting yourself
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }

        // If vendor, also delete vendor profile
        if (user.role === 'vendor') {
            await Vendor.findOneAndDelete({ userId: user._id });
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Invite a new admin via email
// @route   POST /api/users/invite-admin
// @access  Private/Admin
const inviteAdmin = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Please provide an email address' });
        }

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            if (userExists.role === 'admin') {
                return res.status(400).json({ message: 'User is already an admin.' });
            }
            return res.status(400).json({ message: 'User already exists with a different role. Please change their role directly from the dashboard.' });
        }

        // Generate a secure token (valid for 24 hours)
        const token = jwt.sign(
            { email, role: 'admin' },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Generate the invitation link (frontend URL)
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const inviteLink = `${frontendUrl}/invite/${token}`;

        // Send Email
        await sendAdminInvitationEmail(email, inviteLink);

        res.status(200).json({ message: `Invitation sent to ${email}` });
    } catch (error) {
        console.error('Error inviting admin:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Register a new admin via invitation token
// @route   POST /api/users/register-admin
// @access  Public
const registerAdmin = async (req, res) => {
    try {
        const { name, email, password, token } = req.body;

        if (!name || !email || !password || !token) {
            return res.status(400).json({ message: 'Please provide name, email, password, and token' });
        }

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(400).json({ message: 'Invalid or expired invitation token' });
        }

        if (decoded.email !== email || decoded.role !== 'admin') {
            return res.status(400).json({ message: 'Invalid invitation token details' });
        }

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: 'admin',
        });

        if (user) {
            // Generate token for login
            const authToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
                expiresIn: '30d',
            });

            // Set JWT as HTTP-only cookie
            res.cookie('token', authToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            });

            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error('Error registering admin:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getUserProfile, updateUserProfile, getAllUsers, updateUserRole, deleteUser, inviteAdmin, registerAdmin };
