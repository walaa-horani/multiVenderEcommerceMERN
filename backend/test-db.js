const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');
const Vendor = require('./models/Vendor');

dotenv.config();

const test = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/multi-vendor-db');
        console.log('MongoDB Connected');

        const products = await Product.find({}).populate('vendorId', 'storeName');
        console.log('Products found:', products.length);
        console.log('First product:', JSON.stringify(products[0], null, 2));

        process.exit(0);
    } catch (error) {
        console.error('Error during test:', error);
        process.exit(1);
    }
};

test();
