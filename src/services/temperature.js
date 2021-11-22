/**
 * Intended to be an encapsulation of the Service + Characteristic bundle that we provide for each instance of the Conditions accessory, but it's by turns too isolated, and too "fat." The logging isn't useful except for debugging, which a consumer won't care much about, and only the Service actually needs to be returned. What gives?
 */
module.exports = function (api, name) {
    const service = new api.hap.Service.TemperatureSensor(name);
    const currentTemperature = service.getCharacteristic(api.hap.Characteristic.CurrentTemperature);

    service.getCharacteristic(api.hap.Characteristic.Name).setValue('Outside Temperature');

    currentTemperature
        .on(api.hap.CharacteristicEventTypes.GET, (callback) => {
            const val = utils.formatTemperature(currentTemperature.value);

            this.log(`Yielding current temperature: ${val}`);
            callback(undefined, currentTemperature.value);
        })
        .on(api.hap.CharacteristicEventTypes.CHANGE, (change) => {
            const oldVal = utils.formatTemperature(change.oldValue);
            const newVal = utils.formatTemperature(change.newValue);

            log(`Temperature updated from ${oldVal} to ${newVal} in response to a “${change.reason}” event.`);
        });
};