const { Resend } = require('resend');

let resend = null;
const getResend = () => {
    if (!resend && process.env.RESEND_API_KEY) {
        resend = new Resend(process.env.RESEND_API_KEY);
    }
    return resend;
};

const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';

/**
 * Build HTML email template for order events
 */
const buildOrderEmailHTML = (order, eventType, recipientType) => {
    const statusColors = {
        pending: '#f59e0b',
        processing: '#3b82f6',
        shipped: '#6366f1',
        delivered: '#22c55e',
        cancelled: '#ef4444',
    };

    const eventTitles = {
        created: 'New Order Placed',
        cancelled: 'Order Cancelled',
        accepted: 'Order Accepted',
        rejected: 'Order Rejected',
        statusUpdate: 'Order Status Updated',
    };

    const statusColor = statusColors[order.status] || '#888888';

    const productsHTML = order.products
        .map(
            (item) => `
        <tr style="border-bottom: 1px solid #333;">
            <td style="padding: 12px;">
                ${item.productId?.images?.[0]
                    ? `<img src="${item.productId.images[0]}" alt="${item.productId?.name || 'Product'}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;" />`
                    : '<div style="width:60px;height:60px;background:#333;border-radius:8px;"></div>'
                }
            </td>
            <td style="padding: 12px; color: #ffffff;">${item.productId?.name || 'Product'}</td>
            <td style="padding: 12px; color: #cccccc;">x${item.quantity}</td>
            <td style="padding: 12px; color: #d80000; font-weight: bold;">$${Number(item.price).toFixed(2)}</td>
        </tr>
    `
        )
        .join('');

    const shippingHTML = order.shippingAddress
        ? `
        <div style="background: #1a1a1a; padding: 16px; border-radius: 8px; margin-top: 16px;">
            <h3 style="color: #ffffff; margin: 0 0 8px 0;">Shipping Address</h3>
            <p style="color: #cccccc; margin: 0;">
                ${order.shippingAddress.street || ''}<br/>
                ${order.shippingAddress.city || ''}, ${order.shippingAddress.state || ''} ${order.shippingAddress.zipCode || ''}<br/>
                ${order.shippingAddress.country || ''}
            </p>
        </div>
    `
        : '';

    return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="background: #0a0a0a; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="color: #d80000; margin: 0;">MultiVendor Store</h1>
            </div>
            
            <div style="background: #121212; border-radius: 12px; padding: 32px; border: 1px solid #333;">
                <h2 style="color: #ffffff; margin: 0 0 8px 0;">${eventTitles[eventType] || 'Order Update'}</h2>
                <p style="color: #999; margin: 0 0 24px 0;">
                    ${recipientType === 'vendor' ? 'A customer has placed an order for your products.' : 'Here are the details of your order.'}
                </p>
                
                <div style="display: inline-block; background: ${statusColor}22; color: ${statusColor}; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; margin-bottom: 24px;">
                    ${(order.status || 'pending').toUpperCase()}
                </div>

                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="border-bottom: 2px solid #333;">
                            <th style="padding: 12px; text-align: left; color: #999;">Image</th>
                            <th style="padding: 12px; text-align: left; color: #999;">Product</th>
                            <th style="padding: 12px; text-align: left; color: #999;">Qty</th>
                            <th style="padding: 12px; text-align: left; color: #999;">Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${productsHTML}
                    </tbody>
                </table>

                <div style="text-align: right; margin-top: 16px; padding-top: 16px; border-top: 2px solid #333;">
                    <span style="color: #999; font-size: 14px;">Total Amount:</span>
                    <span style="color: #d80000; font-size: 24px; font-weight: bold; margin-left: 8px;">$${Number(order.totalAmount).toFixed(2)}</span>
                </div>

                ${shippingHTML}
            </div>
            
            <p style="color: #666; font-size: 12px; text-align: center; margin-top: 32px;">
                &copy; ${new Date().getFullYear()} MultiVendor Store. All rights reserved.
            </p>
        </div>
    </body>
    </html>
    `;
};

/**
 * Send email for order events
 */
const sendOrderEmail = async ({ to, subject, order, eventType, recipientType }) => {
    if (!process.env.RESEND_API_KEY) {
        console.log(`[Email Skipped] No RESEND_API_KEY set. Would have sent "${subject}" to ${to}`);
        return null;
    }

    try {
        const result = await getResend().emails.send({
            from: FROM_EMAIL,
            to,
            subject,
            html: buildOrderEmailHTML(order, eventType, recipientType),
        });
        console.log(`[Email Sent] "${subject}" to ${to}`);
        return result;
    } catch (error) {
        console.error(`[Email Error] Failed to send "${subject}" to ${to}:`, error);
        return null;
    }
};

/**
 * Notify vendor & customer when order is created
 */
const sendOrderCreatedEmails = async (order, customerEmail, vendorEmail) => {
    await sendOrderEmail({
        to: customerEmail,
        subject: `Order Confirmed - #${order._id}`,
        order,
        eventType: 'created',
        recipientType: 'customer',
    });

    if (vendorEmail) {
        await sendOrderEmail({
            to: vendorEmail,
            subject: `New Order Received - #${order._id}`,
            order,
            eventType: 'created',
            recipientType: 'vendor',
        });
    }
};

/**
 * Notify when order is cancelled
 */
const sendOrderCancelledEmails = async (order, customerEmail, vendorEmail) => {
    await sendOrderEmail({
        to: customerEmail,
        subject: `Order Cancelled - #${order._id}`,
        order,
        eventType: 'cancelled',
        recipientType: 'customer',
    });

    if (vendorEmail) {
        await sendOrderEmail({
            to: vendorEmail,
            subject: `Order Cancelled by Customer - #${order._id}`,
            order,
            eventType: 'cancelled',
            recipientType: 'vendor',
        });
    }
};

/**
 * Notify customer when vendor accepts order
 */
const sendOrderAcceptedEmail = async (order, customerEmail) => {
    await sendOrderEmail({
        to: customerEmail,
        subject: `Order Accepted - #${order._id}`,
        order,
        eventType: 'accepted',
        recipientType: 'customer',
    });
};

/**
 * Notify customer when vendor rejects order
 */
const sendOrderRejectedEmail = async (order, customerEmail) => {
    await sendOrderEmail({
        to: customerEmail,
        subject: `Order Rejected - #${order._id}`,
        order,
        eventType: 'rejected',
        recipientType: 'customer',
    });
};

/**
 * Notify customer on any status update
 */
const sendOrderStatusUpdateEmail = async (order, customerEmail) => {
    await sendOrderEmail({
        to: customerEmail,
        subject: `Order Update - #${order._id} is now ${order.status.toUpperCase()}`,
        order,
        eventType: 'statusUpdate',
        recipientType: 'customer',
    });
};

/**
 * Send admin invitation email
 */
const sendAdminInvitationEmail = async (email, inviteLink) => {
    if (!process.env.RESEND_API_KEY) {
        console.log(`[Email Skipped] No RESEND_API_KEY set. Would have sent invitation to ${email}. Link: ${inviteLink}`);
        return null;
    }

    const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="background: #0a0a0a; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="color: #d80000; margin: 0;">MultiVendor Store</h1>
            </div>
            
            <div style="background: #121212; border-radius: 12px; padding: 32px; border: 1px solid #333; text-align: center;">
                <h2 style="color: #ffffff; margin: 0 0 16px 0;">Admin Invitation</h2>
                <p style="color: #999; margin: 0 0 24px 0;">
                    You have been invited to become an administrator for the MultiVendor Store.
                    Click the button below to accept the invitation and set up your account.
                </p>
                
                <a href="${inviteLink}" style="display: inline-block; background: #d80000; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Accept Invitation</a>
                
                <p style="color: #666; font-size: 14px; margin-top: 24px;">
                    If the button doesn't work, copy and paste this link into your browser:<br/>
                    <span style="color: #d80000;">${inviteLink}</span>
                </p>
            </div>
            
            <p style="color: #666; font-size: 12px; text-align: center; margin-top: 32px;">
                &copy; ${new Date().getFullYear()} MultiVendor Store. All rights reserved.
            </p>
        </div>
    </body>
    </html>
    `;

    try {
        const result = await getResend().emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: 'You are invited to be an Admin!',
            html,
        });
        console.log(`[Email Sent] "Admin Invitation" to ${email}`);
        return result;
    } catch (error) {
        console.error(`[Email Error] Failed to send "Admin Invitation" to ${email}:`, error);
        return null;
    }
};

module.exports = {
    sendOrderCreatedEmails,
    sendOrderCancelledEmails,
    sendOrderAcceptedEmail,
    sendOrderRejectedEmail,
    sendOrderStatusUpdateEmail,
    sendAdminInvitationEmail,
};
