const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

dotenv.config({ path: path.join(__dirname, '../.env') });

const resetAdminPassword = async () => {
    try {
        const email = process.argv[2];
        if (!email) {
            console.error('Error: Please provide an email address.');
            console.error('Usage: node backend/scripts/resetAdminPassword.js <admin-email>');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGO_URI);

        const user = await User.findOne({ email });

        if (!user) {
            console.error(`User ${email} not found.`);
            process.exit(1);
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash('123456', salt);
        await user.save();

        console.log(`Success! Password for ${email} has been reset to: 123456`);
        process.exit(0);
    } catch (error) {
        console.error('Error resetting password:', error);
        process.exit(1);
    }
};

resetAdminPassword();
