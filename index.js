const WeatherConditions = require('./dist/accessory');

module.exports = function (api) {
    api.registerAccessory('WeatherConditions', WeatherConditions);
}
