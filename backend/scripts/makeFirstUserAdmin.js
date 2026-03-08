const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');

dotenv.config({ path: path.join(__dirname, '../.env') });

const makeFirstUserAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // Find any user
        const user = await User.findOne();

        if (!user) {
            console.error('No users found in database.');
            process.exit(1);
        }

        user.role = 'admin';
        await user.save();

        console.log(`Success! Given admin role to user: ${user.email}`);
        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

makeFirstUserAdmin();
