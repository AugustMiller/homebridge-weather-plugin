const https = require('https');
const { URLSearchParams } = require('url');

const OPENWEATHER_API_BASE_URL = 'https://api.openweathermap.org/data/2.5';
const MIN_REFRESH_INTERVAL = 10000;

class WeatherConditions {
    constructor(log, config, api) {
        // System references:
        this.api = api;
        this.log = log;

        // Configuration values, consistent throughout the life of the Accessory:
        this.name = config.name;
        this.apiKey = config.apiKey;
        this.locationQuery = config.locationQuery;
        this.updateInterval = Math.max(config.updateInterval, MIN_REFRESH_INTERVAL);

        // Temperature Service + Characteristic:
        this.temperatureService = new this.api.hap.Service.TemperatureSensor(this.name);
        this.temperatureCharacteristic = this.temperatureService.getCharacteristic(this.api.hap.Characteristic.CurrentTemperature);

        this.temperatureCharacteristic
            .on(this.api.hap.CharacteristicEventTypes.GET, (callback) => {
                const val = this.formatTemperature(this.temperatureCharacteristic.value);

                this.log(`Yielding current temperature: ${val}`);
                callback(undefined, this.temperatureCharacteristic.value);
            })
            .on(this.api.hap.CharacteristicEventTypes.CHANGE, (change) => {
                const oldVal = this.formatTemperature(change.oldValue);
                const newVal = this.formatTemperature(change.newValue);

                this.log(`Temperature updated from ${oldVal} to ${newVal} in response to a “${change.reason}” event.`);
            });

        // Humidity Service + Characteristic:
        this.humidityService = new this.api.hap.Service.HumiditySensor(this.name);
        this.humidityCharacteristic = this.humidityService.getCharacteristic(this.api.hap.Characteristic.CurrentRelativeHumidity);

        this.humidityCharacteristic
            .on(this.api.hap.CharacteristicEventTypes.GET, (callback) => {
                this.log(`Yielding current humidity: ${this.humidityCharacteristic.value}%`);
                callback(undefined, this.humidityCharacteristic.value);
            })
            .on(this.api.hap.CharacteristicEventTypes.CHANGE, (change) => {
                this.log(`Humidity updated from ${change.oldValue}% to ${change.newValue}% in response to a “${change.reason}” event.`);
            });


        // Information Service + Make/Model Characteristics:
        this.informationService = new this.api.hap.Service.AccessoryInformation();

        this.informationService
            .setCharacteristic(this.api.hap.Characteristic.Manufacturer, 'Vandelay Industries')
            .setCharacteristic(this.api.hap.Characteristic.Model, 'VI-ECIN-420-69');

        // Start the API request loop...
        setInterval(() => {
            this.updateConditions();
        }, this.updateInterval);

        // ...and perform an initial lookup:
        this.updateConditions();
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
            this.informationService,
        ];
    }

    /**
     * Performs a query to the OpenWeather API and updates relevant Accessory properties.
     */
    updateConditions () {
        this.log(`Performing scheduled weather conditions update!`);

        const conditionsQuery = new URLSearchParams({
            q: this.locationQuery,
            appid: this.apiKey,
            units: 'metric',
        });

        try {
            this.makeGetRequest('weather', conditionsQuery, (status, conditions) => {
                this.temperatureCharacteristic.updateValue(conditions.main.temp);
                this.humidityCharacteristic.updateValue(conditions.main.humidity);
            });
        } catch (e) {
            this.log.error(e.message);
        }
    }

    /**
     * Makes a GET request to the OpenWeather API.
     */
    makeGetRequest (path, query, onResult) {
        const req = https.get(`${OPENWEATHER_API_BASE_URL}/${path}?${query}`, (res) => {
            let output = '';

            res.setEncoding('utf8');

            res.on('data', (chunk) => {
                output += chunk;
            });

            res.on('end', () => {
                onResult(res.statusCode, JSON.parse(output));
            });
        });

        req.on('error', (err) => {
            throw err;
        });

        req.end();
    }

    /**
     * Formats a temperature value.
     */
    formatTemperature(temp) {
        return `${temp}°C`;
    }
}

module.exports = WeatherConditions;