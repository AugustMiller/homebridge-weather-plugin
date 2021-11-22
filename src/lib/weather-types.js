const codes = {
    THUNDERSTORM: 200,
    DRIZZLE: 300,
    RAIN: 500,
    SNOW: 600,
    ATMOSPHERE: 700,
    CLEAR: 800,
};

/**
 * Checks whether a specific or general weather code is present in the list.
 * 
 * @param {Number} code Target weather type.
 * @param {Array} list Conditions to check against.
 * @param {Boolean} exact Whether to compare as an exact match, or just for the generic type.
 * @returns {Boolean}
 */
const includes = function (code, list, exact = false) {
    for (let test of list) {
        const value = exact ? test : Math.floor(test / 100) * 100;

        // Did it match?
        if (code === value) {
            return true;
        }
    }

    return false;
};

module.exports = {
    codes,
    includes,
};