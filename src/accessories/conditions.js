const api = require('../lib/api');
const utils = require ('../lib/utils');

const MIN_REFRESH_INTERVAL = 10000;

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
            this.cloudinessService,
            this.informationService,
        ];
    }

    /**
     * Performs a query to the OpenWeather API and updates relevant Accessory properties.
     */
    updateConditions () {
        this.log(`Performing scheduled weather conditions update!`);

        const query = {
            q: this.locationQuery,
            appid: this.apiKey,
            units: 'metric',
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
}

module.exports = WeatherConditions;
