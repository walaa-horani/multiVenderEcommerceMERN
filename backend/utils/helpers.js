/**
 * Format a number as currency string
 * @param {number} amount
 * @returns {string}
 */
const formatCurrency = (amount) => {
    return `$${Number(amount).toFixed(2)}`;
};

/**
 * Calculate discounted price
 * @param {number} price - Original price
 * @param {number} discount - Discount percentage (0-100)
 * @returns {number} Final price after discount
 */
const calculateDiscount = (price, discount) => {
    if (discount < 0 || discount > 100) return price;
    return Number((price - (price * discount) / 100).toFixed(2));
};

/**
 * Generate a URL-friendly slug from text
 * @param {string} text
 * @returns {string}
 */
const generateSlug = (text) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
};

module.exports = { formatCurrency, calculateDiscount, generateSlug };
