const WeatherConditions = require('./src/accessories/conditions');

module.exports = function (api) {
    api.registerAccessory('homebridge-weather-plugin', 'WeatherConditions', WeatherConditions);
}
