const WeatherConditions = require('./src/accessory.js');

module.exports = function (api) {
    api.registerAccessory('homebridge-weather-plugin', 'WeatherConditions', WeatherConditions);
}
