const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Vendor = require('./models/Vendor');
const Product = require('./models/Product');
const bcrypt = require('bcryptjs');

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/multi-vendor-db');
        console.log('MongoDB Connected for Seeding');
    } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
    }
};

const productsData = [
    {
        name: "Premium Wireless Headphones",
        description: "High-quality wireless headphones with active noise cancellation and 30-hour battery life. Perfect for music lovers and professionals.",
        price: 299.99,
        images: ["https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aXJlbGVzcyUyMGhlYWRwaG9uZXMlMjBibGFja3xlbnwxfHx8fDE3NzI5MTU4ODh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"],
        category: "Electronics",
        featured: true,
        stock: 45,
        rating: 4.8,
        reviews: 234,
    },
    {
        name: "Smart Watch Pro",
        description: "Advanced fitness tracking, heart rate monitoring, and seamless smartphone integration. Water-resistant up to 50m.",
        price: 399.99,
        images: ["https://images.unsplash.com/photo-1669480380743-f76990b9bc44?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbWFydCUyMHdhdGNoJTIwZml0bmVzc3xlbnwxfHx8fDE3NzI4NzkzNjF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"],
        category: "Electronics",
        featured: true,
        stock: 32,
        rating: 4.6,
        reviews: 187,
    },
    {
        name: "Designer Leather Jacket",
        description: "Genuine leather jacket with classic design. Perfect for any occasion, combining style with durability.",
        price: 499.99,
        images: ["https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsZWF0aGVyJTIwamFja2V0JTIwZmFzaGlvbnxlbnwxfHx8fDE3NzI5MTAzMTF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"],
        category: "Fashion",
        featured: true,
        stock: 15,
        rating: 4.9,
        reviews: 156,
    },
    {
        name: "4K Action Camera",
        description: "Capture stunning 4K footage with advanced stabilization. Waterproof design for extreme adventures.",
        price: 249.99,
        images: ["https://images.unsplash.com/photo-1686226043803-51aea0da1c2c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhY3Rpb24lMjBjYW1lcmElMjBnb3Byb3xlbnwxfHx8fDE3NzI4OTA4MDN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"],
        category: "Electronics",
        featured: true,
        stock: 58,
        rating: 4.7,
        reviews: 312,
    },
    {
        name: "Professional Coffee Maker",
        description: "Brew barista-quality coffee at home with programmable settings and thermal carafe.",
        price: 179.99,
        images: ["https://images.unsplash.com/photo-1608354580875-30bd4168b351?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2ZmZWUlMjBtYWtlciUyMG1hY2hpbmV8ZW58MXx8fHwxNzcyOTA4MjczfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"],
        category: "Home & Kitchen",
        featured: false,
        stock: 67,
        rating: 4.5,
        reviews: 423,
    },
    {
        name: "Yoga Mat Premium",
        description: "Extra-thick, non-slip yoga mat with carrying strap. Eco-friendly materials for comfortable practice.",
        price: 49.99,
        images: ["https://images.unsplash.com/photo-1746796751590-a8c0f15d4900?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b2dhJTIwbWF0JTIwZXhlcmNpc2V8ZW58MXx8fHwxNzcyODg0Mjc2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"],
        category: "Sports",
        featured: false,
        stock: 120,
        rating: 4.4,
        reviews: 289,
    },
    {
        name: "Mechanical Gaming Keyboard",
        description: "RGB backlit mechanical keyboard with customizable keys and ultra-responsive switches.",
        price: 149.99,
        images: ["https://images.unsplash.com/photo-1645802106095-765b7e86f5bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYW1pbmclMjBrZXlib2FyZCUyMHJnYnxlbnwxfHx8fDE3NzI4ODk0Mjd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"],
        category: "Electronics",
        featured: false,
        stock: 89,
        rating: 4.8,
        reviews: 567,
    },
    {
        name: "Running Shoes Elite",
        description: "Lightweight running shoes with advanced cushioning and breathable mesh upper. Perfect for marathon training.",
        price: 129.99,
        images: ["https://images.unsplash.com/photo-1709258228137-19a8c193be39?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxydW5uaW5nJTIwc2hvZXMlMjBzcG9ydHxlbnwxfHx8fDE3NzI4MTA2NzN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"],
        category: "Sports",
        featured: true,
        stock: 78,
        rating: 4.7,
        reviews: 412,
    },
    {
        name: "Portable Bluetooth Speaker",
        description: "360-degree sound with deep bass. Waterproof and 12-hour battery life for outdoor adventures.",
        price: 79.99,
        images: ["https://images.unsplash.com/photo-1674303324806-7018a739ed11?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibHVldG9vdGglMjBzcGVha2VyJTIwcG9ydGFibGV8ZW58MXx8fHwxNzcyODYzNzU5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"],
        category: "Electronics",
        featured: false,
        stock: 156,
        rating: 4.5,
        reviews: 678,
    },
    {
        name: "Luxury Sunglasses",
        description: "UV400 protection with polarized lenses. Timeless design that suits any face shape.",
        price: 199.99,
        images: ["https://images.unsplash.com/photo-1759933253608-ba60cfb8dcf0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdW5nbGFzc2VzJTIwbHV4dXJ5JTIwZmFzaGlvbnxlbnwxfHx8fDE3NzI5MTU5OTJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"],
        category: "Fashion",
        featured: false,
        stock: 43,
        rating: 4.6,
        reviews: 234,
    },
    {
        name: "Stainless Steel Water Bottle",
        description: "Insulated water bottle keeps drinks cold for 24 hours or hot for 12 hours. BPA-free.",
        price: 34.99,
        images: ["https://images.unsplash.com/photo-1602143407151-7111542de6e8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YXRlciUyMGJvdHRsZSUyMHN0YWlubGVzcyUyMHN0ZWVsfGVufDF8fHx8MTc3MjkxNTk5Mnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"],
        category: "Sports",
        featured: false,
        stock: 234,
        rating: 4.3,
        reviews: 891,
    },
    {
        name: "Wireless Charging Pad",
        description: "Fast wireless charging for all Qi-enabled devices. Sleek design with LED indicator.",
        price: 39.99,
        images: ["https://images.unsplash.com/photo-1633381638729-27f730955c23?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aXJlbGVzcyUyMGNoYXJnaW5nJTIwcGFkfGVufDF8fHx8MTc3MjkxMzM4Mnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"],
        category: "Electronics",
        featured: false,
        stock: 198,
        rating: 4.4,
        reviews: 345,
    }
];

const importData = async () => {
    try {
        await connectDB();

        await mongoose.connection.db.dropDatabase();
        console.log('Database dropped');

        const hashedPassword = await bcrypt.hash('123456', 10);

        const createdUsers = await User.insertMany([
            { name: 'Admin User', email: 'admin@example.com', password: hashedPassword, role: 'admin' },
            { name: 'Vendor 1', email: 'vendor1@example.com', password: hashedPassword, role: 'vendor' },
            { name: 'Vendor 2', email: 'vendor2@example.com', password: hashedPassword, role: 'vendor' },
            { name: 'Customer 1', email: 'customer1@example.com', password: hashedPassword, role: 'customer' }
        ]);

        const vendorUserId1 = createdUsers[1]._id;
        const vendorUserId2 = createdUsers[2]._id;

        const createdVendors = await Vendor.insertMany([
            { userId: vendorUserId1, storeName: 'TechVendor', storeDescription: 'Best electronics' },
            { userId: vendorUserId2, storeName: 'FashionHub', storeDescription: 'Premium fashion' }
        ]);

        const vendor1 = createdVendors[0]._id;
        const vendor2 = createdVendors[1]._id;

        const sampleProducts = productsData.map(product => {
            // Assign Fashion and Sports to vendor2, rest to vendor1
            const vendorId = ['Fashion', 'Sports'].includes(product.category) ? vendor2 : vendor1;
            return { ...product, vendorId };
        });

        await Product.insertMany(sampleProducts);

        console.log('Data Imported!');
        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

importData();
