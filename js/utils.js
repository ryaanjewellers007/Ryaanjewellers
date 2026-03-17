// utils.js

/**
 * Formats a price to two decimal places and adds a currency symbol.
 * @param {number} price - The price to format.
 * @param {string} currency - The currency symbol to use.
 * @returns {string} Formatted price string.
 */
function formatPrice(price, currency) {
    return `${currency}${price.toFixed(2)}`;
}

/**
 * Formats a date to the specified format.
 * @param {Date} date - The date object to format.
 * @returns {string} Formatted date string (YYYY-MM-DD).
 */
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Validates form fields based on the provided rules.
 * @param {object} fields - Object containing form field values.
 * @param {object} rules - Object containing validation rules.
 * @returns {object} Object with validation status and messages.
 */
function validateForm(fields, rules) {
    const errors = {};
    for (const field in rules) {
        if (rules[field].required && !fields[field]) {
            errors[field] = `${field} is required.`;
        }
    }
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}

/**
 * Stores a value in localStorage.
 * @param {string} key - The key under which to store the value.
 * @param {any} value - The value to store.
 */
function setLocalStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

/**
 * Retrieves a value from localStorage.
 * @param {string} key - The key of the value to retrieve.
 * @returns {any} The parsed value from localStorage or null.
 */
function getLocalStorage(key) {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
}

/**
 * Manipulates a string (e.g., uppercase, lowercase, etc.).
 * @param {string} str - The string to manipulate.
 * @param {string} type - Type of manipulation ("upper", "lower").
 * @returns {string} Manipulated string.
 */
function manipulateString(str, type) {
    if (type === 'upper') {
        return str.toUpperCase();
    } else if (type === 'lower') {
        return str.toLowerCase();
    }
    return str;
}

// Export functions
module.exports = {
    formatPrice,
    formatDate,
    validateForm,
    setLocalStorage,
    getLocalStorage,
    manipulateString,
};