---
description: Multi-vendor eCommerce skills and guidelines
---

# Multi-Vendor E-Commerce Project Skills & Guidelines

## 1. UI Design System
- **Theme**: Dark Theme (Deep Dark/Black background `#0000` to `#121212`)
- **Primary Color**: `#d80000` (Deep Red) used for Logo, CTA buttons, Prices, Active nav links, and Badges.
- **Aesthetic**: Premium, modern, glassmorphism, smooth animations, and high-contrast text (White for headings, Cool Gray for subheadings).
- **Layout & Components**:
  - **Header**: Transparent/Dark nav bar with Logo left, Home/Products links center, Cart and Login/Signup right.
  - **Product Cards**: High-quality images on dark card backgrounds. Includes category label, star rating, bold white title, bold red price, red tag badges (e.g., "Featured"), and a full-width red "Add to Cart" block at the bottom.
  - **Hero Section**: Prominent headings with "Shop Now" (solid red) and "Create Account" (outlined) buttons.

## 2. Roles & Permissions
- **Admin**: Full system access, manage vendors, users, categories, global settings, view all sales. Admin role can ONLY be assigned by an existing admin through the admin dashboard — never through public registration.
- **Vendor**: Manage own products, inventory, orders, store profile, view own sales analytics.
- **Customer**: Browse products, manage cart, place orders, view order history, manage profile and addresses.

## 3. Core Functions & Helpers
- `formatCurrency(amount)`: Standardize price display.
- `calculateDiscount(price, discount)`: Calculate final price.
- `generateSlug(text)`: Create URL-friendly slugs for products.
- `verifyToken(req, res, next)`: JWT authentication middleware.
- `checkRole(allowedRoles)`: Authorization middleware.

## 4. APIs Structure
- `/api/auth/*`: Login, Register (customer/vendor only, no admin), Logout, Password Reset.
- `/api/users/*`: Profile management, role assignment (admin only).
- `/api/products/*`: CRUD operations for products (Vendor/Admin), search/filter (Customer).
- `/api/orders/*`: Order creation, status updates, history.
- `/api/vendors/*`: Vendor onboarding, store management.
- `/api/cart/*`: Cart management — synced to MongoDB on every operation.
- `/api/categories/*`: Category CRUD (admin only).
- `/api/payments/*`: Stripe checkout sessions, webhooks, vendor earnings.
- Don't save user's data in local storage, save it in cookies (httpOnly).
- Handle giving access to admin and vendor and manage their roles — admin role is only assignable by existing admins.
- Registration page only shows Customer and Vendor options. Vendor requires storeName.

## 5. Database Models
- **User**: name, email, password, role ('customer', 'vendor', 'admin').
- **Vendor**: userId (ref User), storeName, storeDescription, storeLogo.
- **Product**: vendorId (ref Vendor), name, description, price, stock, category, images.
- **Order**: userId (ref User), products [{productId, quantity, price}], totalAmount, shippingAddress, status.
- **Cart**: userId (ref User), products [{productId, quantity}] — synced to MongoDB on every add/remove/update.
- **Payment**: orderId, userId, amount, stripeSessionId, stripePaymentIntentId, status.
- **Category**: name, slug, description, image.

## 6. Email Notifications (Resend)
- Whenever user creates an order, send email to customer and vendor.
- Whenever user cancels an order, send email to customer and vendor.
- Whenever vendor accepts an order, send email to customer.
- Whenever vendor rejects an order, send email to customer.
- Whenever vendor updates order status, send email to customer.
- Use Resend to send emails. Gracefully skip if RESEND_API_KEY is not set.
- Email templates are branded dark-themed HTML with all order details.
- **Note**: Resend free tier only allows sending to the account owner's email. To send to any email, verify a custom domain in Resend.

## 7. Cart Sync
- Cart operations (add, remove, update quantity, clear) must sync to MongoDB in real time.
- On user login, cart is fetched from MongoDB and displayed.
- LocalStorage is used as a fallback/backup only.

## 8. Payments (Stripe)
- After placing an order, customer is redirected to Stripe checkout page for payment.
- Stripe webhook updates order status to "processing" on successful payment.
- Vendor earnings are calculated from delivered orders containing their products.
- Payment records are saved in MongoDB with Stripe session/intent IDs.
- Stripe secret key, webhook secret must be in backend `.env`.

## 9. Admin Dashboard & Access
- Tabbed interface: Overview, Orders, Products, Users, Vendors, Categories.
- **Admin Bootstrapping**: A CLI seeder script (`seedAdmin.js`) or specific environment variable is used to grant admin privileges to the very first user.
- **Admin Invitations**: Admins can send email invitations from the dashboard to invite other users to become admins. The email contains a secure, unique registration link or code.
- Manage user roles (can promote to admin directly if they already have an account), delete users.
- Manage vendors, categories, products, orders.
- View sales analytics with charts.

## 10. Vendor Dashboard
- Tabbed interface: Overview, Orders, Products.
- View earnings from API, sales trends chart.
- Manage orders (status updates), product CRUD.

## 11. Registration Security
- Public registration only allows Customer and Vendor roles.
- Admin option is NOT available in the registration form.
- Backend enforces this: if someone sends role='admin' via API, it defaults to 'customer'.
- Vendor registration requires storeName field.
