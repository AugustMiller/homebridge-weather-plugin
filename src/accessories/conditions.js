const api = require('../lib/api');
const utils = require('../lib/utils');
const weatherTypes = require('../lib/weather-types');

const MIN_REFRESH_INTERVAL = 10000;
const FORECAST_MAX_HOURS = 4;
const DEFAULT_TEMPERATURE_UNIT = 'metric';

/**
 * Accessory providing Services for current temperature, humidity, and cloud-cover.
 */
class WeatherConditions {
    constructor (log, config, api) {
        // System references:
        this.api = api;
        this.log = log;

        // Configuration values, consistent throughout the life of the Accessory:
        this.name = config.name;
        this.apiKey = config.apiKey;
        this.locationQuery = config.locationQuery;
        this.updateInterval = Math.max(config.updateInterval, MIN_REFRESH_INTERVAL);


        // Temperature Service + Characteristics:
        this.temperatureService = new this.api.hap.Service.TemperatureSensor(this.name);
        this.temperatureCharacteristic = this.temperatureService.getCharacteristic(this.api.hap.Characteristic.CurrentTemperature);

        this.temperatureService.getCharacteristic(this.api.hap.Characteristic.Name).setValue('Outside Temperature');

        this.temperatureCharacteristic
            .on(this.api.hap.CharacteristicEventTypes.GET, (callback) => {
                const val = utils.formatTemperature(this.temperatureCharacteristic.value);

                this.log(`Yielding current temperature: ${val}`);
                callback(undefined, this.temperatureCharacteristic.value);
            })
            .on(this.api.hap.CharacteristicEventTypes.CHANGE, (change) => {
                const oldVal = utils.formatTemperature(change.oldValue);
                const newVal = utils.formatTemperature(change.newValue);

                this.log(`Temperature updated from ${oldVal} to ${newVal} in response to a “${change.reason}” event.`);
            });


        // Humidity Service + Characteristic:
        this.humidityService = new this.api.hap.Service.HumiditySensor(this.name);
        this.humidityCharacteristic = this.humidityService.getCharacteristic(this.api.hap.Characteristic.CurrentRelativeHumidity);

        this.humidityService.getCharacteristic(this.api.hap.Characteristic.Name).setValue('Outside Humidity');

        this.humidityCharacteristic
            .on(this.api.hap.CharacteristicEventTypes.GET, (callback) => {
                this.log(`Yielding current humidity: ${this.humidityCharacteristic.value}%`);
                callback(undefined, this.humidityCharacteristic.value);
            })
            .on(this.api.hap.CharacteristicEventTypes.CHANGE, (change) => {
                this.log(`Humidity updated from ${change.oldValue}% to ${change.newValue}% in response to a “${change.reason}” event.`);
            });


        // Cloud Cover Service + Characteristic:
        this.cloudinessService = new this.api.hap.Service.LightSensor(this.name);
        this.cloudinessCharacteristic = this.cloudinessService.getCharacteristic(this.api.hap.Characteristic.CurrentAmbientLightLevel);

        this.cloudinessService.getCharacteristic(this.api.hap.Characteristic.Name).setValue('Cloud Cover');

        this.cloudinessCharacteristic.setProps({
            minValue: 0,
            maxValue: 100,
            unit: this.api.hap.Characteristic.Units.PERCENTAGE,
        });


        // Rain Forecasted Service + Characteristic
        this.forecastedRainService = new this.api.hap.Service.StatefulProgrammableSwitch(this.name);
        this.forecastedRainCharacteristic = this.forecastedRainService.getCharacteristic(this.api.hap.Characteristic.ProgrammableSwitchOutputState);

        this.forecastedRainService.getCharacteristic(this.api.hap.Characteristic.Name).setValue('Rain Soon');


        // Information Service + Make/Model Characteristics:
        this.informationService = new this.api.hap.Service.AccessoryInformation();

        this.informationService
            .setCharacteristic(this.api.hap.Characteristic.Manufacturer, 'Vandelay Industries')
            .setCharacteristic(this.api.hap.Characteristic.Model, 'VI-ECIN-420-69');

        // Start the API request loop...
        setInterval(() => {
            this.updateCurrentConditions();
            this.updateForecast();
        }, this.updateInterval);

        // ...and perform an initial lookup(s):
        this.updateCurrentConditions();
        this.updateForecast();
    }

    /*
     * This method is optional to implement. It is called when HomeKit ask to identify the accessory.
     * Typical this only ever happens at the pairing process.
     */
    identify () {
        this.log('Identify!');
    }

    /*
     * This method is called directly after creation of this instance.
     * It should return all services which should be added to the accessory.
     */
    getServices () {
        return [
            this.temperatureService,
            this.humidityService,
            this.cloudinessService,
            this.forecastedRainService,
            this.informationService,
        ];
    }

    /**
     * Performs a query to the OpenWeather API for the current conditions and updates relevant Accessory properties.
     */
    updateCurrentConditions () {
        this.log(`Performing scheduled weather conditions update!`);

        const query = {
            q: this.locationQuery,
            appid: this.apiKey,
            units: DEFAULT_TEMPERATURE_UNIT,
        };

        api.get('weather', query)
            .then((conditions) => {
                this.temperatureCharacteristic.updateValue(conditions.main.temp);
                this.humidityCharacteristic.updateValue(conditions.main.humidity);
                this.cloudinessCharacteristic.updateValue(conditions.clouds.all);
            })
            .catch((err) => {
                this.log.error(err.message);
            });
    }

    /**
     * Performs a query to the OpenWeather API for the forecast and updates relevant Accessory properties.
     */
    updateForecast () {
        const bogusVal = Math.random() > 0.5;

        this.log(`Forecast is not yet implemented! This is only a feature for paid plans, it turns out. Setting forecast to bogus value: [${bogusVal ? 'yes' : 'no'}].`);

        this.forecastedRainCharacteristic.updateValue(bogusVal);

        return;

        const query = {
            q: this.locationQuery,
            appid: this.apiKey,
            units: DEFAULT_TEMPERATURE_UNIT,
            cnt: FORECAST_MAX_HOURS,
        };

        api.get('hourly', query)
            .then((forecast) => {
                this.log(forecast);
                const nextHour = forecast.list[0];
                const types = nextHour.weather.map(function (w) { return w.id; });
                const isRainLikely = weatherTypes.includes(weatherTypes.codes.RAIN, types) || weatherTypes.includes(weatherTypes.codes.DRIZZLE, types);

                this.forecastedRainCharacteristic.updateValue(isRainLikely);
            })
            .catch((err) => {
                this.log.error(err.message);
            });
    }

}

module.exports = WeatherConditions;
