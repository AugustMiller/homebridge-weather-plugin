const Conditions = require('../accessories/conditions');

/**
 * Weather Platform Plugin
 * 
 * I don't think this actually works like I thought it would. Instead of being a sort of centralized "brain" for multiple similar accessories, it's really meant as a middleware between an external API and Accessory instances exposed via Homebridge.
 */
class Weather {
    constructor (log, config, api) {
        this.accessories = [];
    }

    /**
     * Invoked when Homebridge restores cached accessories from disk at startup, once for each registered accessory.
     */
    configureAccessory (accessory) {
        this.log.info('Loading accessory from cache:', accessory.displayName);

        this.accessories.push(accessory);
    }
}

module.exports = Weather;