const WeatherConditions = require('./src/accessories/conditions');
// const Weather = require('./src/platforms/weather')

module.exports = function (api) {
    // api.registerPlatform('Weather', Weather);
    api.registerAccessory('homebridge-weather-plugin', 'WeatherConditions', WeatherConditions);
}
