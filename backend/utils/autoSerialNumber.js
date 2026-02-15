/**
 * Auto Serial Number Generator Utility
 * Generates unique serial numbers with prefixes for different modules
 */

const Counter = require('../models/Counter');

/**
 * Generate next serial number for a given prefix
 * @param {string} prefix - Prefix for the serial number (e.g., 'STU', 'TEA', 'CRS')
 * @returns {Promise<string>} - Formatted serial number (e.g., 'STU-0001')
 */
async function generateSerialNumber(prefix) {
  try {
    // Find or create counter document for this prefix
    const counter = await Counter.findOneAndUpdate(
      { prefix: prefix.toUpperCase() },
      { $inc: { count: 1 } },
      { new: true, upsert: true }
    );

    if (!counter) {
      // Fallback: use timestamp if counter creation fails
      const timestamp = Date.now().toString().slice(-6);
      console.warn(`Counter not found for ${prefix}, using timestamp fallback: ${timestamp}`);
      return `${prefix.toUpperCase()}-${timestamp}`;
    }

    // Format: PREFIX-0001 (4 digits)
    const serialNumber = `${prefix.toUpperCase()}-${String(counter.count).padStart(4, '0')}`;
    return serialNumber;
  } catch (error) {
    console.error(`Error generating serial number for prefix ${prefix}:`, error);
    // Fallback: use timestamp if generation fails
    const timestamp = Date.now().toString().slice(-6);
    console.warn(`Using timestamp fallback for ${prefix}: ${timestamp}`);
    return `${prefix.toUpperCase()}-${timestamp}`;
  }
}

/**
 * Get current serial number without incrementing
 * @param {string} prefix - Prefix for the serial number
 * @returns {Promise<string>} - Current serial number
 */
async function getCurrentSerialNumber(prefix) {
  try {
    const counter = await Counter.findOne({ prefix });
    if (!counter) {
      return `${prefix}-0000`;
    }
    return `${prefix}-${String(counter.count).padStart(4, '0')}`;
  } catch (error) {
    console.error(`Error getting current serial number for prefix ${prefix}:`, error);
    throw error;
  }
}

/**
 * Reset counter for a prefix (use with caution)
 * @param {string} prefix - Prefix to reset
 * @returns {Promise<void>}
 */
async function resetCounter(prefix) {
  try {
    await Counter.findOneAndUpdate(
      { prefix },
      { count: 0 },
      { upsert: true }
    );
  } catch (error) {
    console.error(`Error resetting counter for prefix ${prefix}:`, error);
    throw error;
  }
}

module.exports = {
  generateSerialNumber,
  getCurrentSerialNumber,
  resetCounter
};

