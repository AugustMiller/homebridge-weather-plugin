import {
    AccessoryConfig,
    AccessoryPlugin,
    API,
    Characteristic,
    CharacteristicChange,
    CharacteristicEventTypes,
    CharacteristicGetCallback,
    Logging,
    Service,
} from 'homebridge';

import https from 'https';
import { URLSearchParams } from 'url';

const OPENWEATHER_API_BASE_URL = 'https://api.openweathermap.org/data/2.5';

/*
 * Initializer function called when the plugin is loaded.
 */
export = (api: API) => {
    api.registerAccessory('WeatherConditions', WeatherConditions);
};

class WeatherConditions implements AccessoryPlugin {
    private readonly api: API;
    private readonly log: Logging;
    private readonly name: string;
    private readonly apiKey: string;
    private readonly locationQuery: string;
    private readonly updateInterval: number;

    private readonly temperatureService: Service;
    private readonly informationService: Service;

    private readonly temperatureCharacteristic: Characteristic;

    constructor(log: Logging, config: AccessoryConfig, api: API) {
        // System references:
        this.api = api;
        this.log = log;

        // Configuration values, consistent throughout the life of the Accessory:
        this.name = config.name;
        this.apiKey = config.apiKey;
        this.locationQuery = config.locationQuery;
        this.updateInterval = config.updateInterval;

        // Temperature Service + Characteristic:
        this.temperatureService = new this.api.hap.Service.TemperatureSensor(this.name);
        this.temperatureCharacteristic = this.temperatureService.getCharacteristic(this.api.hap.Characteristic.CurrentTemperature);

        this.temperatureCharacteristic
            .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
                const val = this.formatValue(this.temperatureCharacteristic.value);

                this.log(`Yielding current temperature for “${this.name},” ${val}`);
                callback(undefined, this.temperatureCharacteristic.value);
            })
            .on(CharacteristicEventTypes.CHANGE, (change: CharacteristicChange) => {
                const oldVal = this.formatValue(change.oldValue);
                const newVal = this.formatValue(change.newValue);

                this.log(`Temperature for “${this.name}” updated from ${oldVal} to ${newVal} in response to a “${change.reason}” event.`);
            });

        // Information Service + Make/Model Characteristics:
        this.informationService = new this.api.hap.Service.AccessoryInformation();

        this.informationService
            .setCharacteristic(this.api.hap.Characteristic.Manufacturer, 'Vandelay Industries')
            .setCharacteristic(this.api.hap.Characteristic.Model, 'VI-ECIN-420-69');

        // Start the API request loop:
        setInterval(() => {
            this.updateConditions();
        }, this.updateInterval);

        this.log.info(`WeatherCondition Accessory initialized for “${this.name}”`);
    }

    /*
     * This method is optional to implement. It is called when HomeKit ask to identify the accessory.
     * Typical this only ever happens at the pairing process.
     */
    identify(): void {
        this.log('Identify!');
    }

    /*
     * This method is called directly after creation of this instance.
     * It should return all services which should be added to the accessory.
     */
    getServices(): Service[] {
        return [
            this.temperatureService,
            this.informationService,
        ];
    }

    /**
     * Performs a query to the OpenWeather API and updates relevant Accessory properties.
     */
    updateConditions(): void {
        this.log(`Performing scheduled weather conditions update for “${this.name}”`);

        const conditionsQuery = new URLSearchParams({
            q: this.locationQuery,
            appid: this.apiKey,
            units: 'metric',
        });

        try {
            this.makeGetRequest('weather', conditionsQuery, (status, conditions) => {
                this.temperatureCharacteristic.updateValue(conditions.main.temp);
            });
        } catch (e: object) {
            this.log.error(e.message);
        }
    }

    /**
     * Makes a GET request to the OpenWeather API.
     */
    makeGetRequest(
        path: string,
        query: URLSearchParams,
        onResult: { (code: number|undefined, resp: object): void },
    ): void {
        const req = https.get(`${OPENWEATHER_API_BASE_URL}/${path}?${query}`, (res) => {
            let output: string;

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
    formatValue(temp): string {
        return `${temp}°C`;
    }
}
