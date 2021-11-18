/**
 * Formats a temperature value.
 * 
 * @param {number} temp Temperature to format
 * @returns {string}
 */
function formatTemperature (temp) {
    return `${temp}°C`;
}

module.exports = {
    formatTemperature,
};
