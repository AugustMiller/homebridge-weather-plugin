# Weather Conditions Homebridge Accessory

This plugin exposes local weather data to your Homebridge instance in the form of Temperature, Humidity, and Luminosity sensors.

> Currently, Homekit doesn't support either of these as triggers for automation, so they're largely useless!

## Installation

If you want to use the plugin, you'll have to download this repo or clone it into your installation's `node_modules` folder, and add a line to the main `package.json` file:

```json
{
  "private": true,
  "description": "This file keeps track of which plugins should be installed.",
  "dependencies": {
    "homebridge-weather-plugin": "*"
  }
}
```

Restart Homebridge and you should see the Plugin bootstrap!

### API Key

For now, the only supported data provider is [OpenWeather](https://openweathermap.org/). They have a free tier that should be adequate for most installations.

### Configuration

Out-of-the-box, no Accessories are created. Visit the "Plugins" page of the Homebridge UI and click "Settings" on the plugin's tile.

From here, you'll be asked to fill out a _Name_, _API Key_, _Query_, and _Interval_.

#### Name
The default name for each Accessory created by Homebridge. You can have sensors for anywhere in the world, say, if you want to know when it's raining in your hometown and (eventually) turn a light blue.

#### API Key
Visit OpenWeather and sign up for an account. Copy your default API key, or create a dedicated one just for your automation work.

#### Query
This accepts any string, but in order to avoid errors with the API call, it has to be compatible with the [Current Weather Data](https://openweathermap.org/current) endpoint's `q` param.

#### Interval
Refresh frequency, in miliseconds. Don't be too aggressive with this!

## Planned Features
- [ ] Switches or other binary sensors for common weather conditions. Not sure how to represent these without being confusing, in-app (i.e. using the faucet service/characteristic for rain)!
- [ ] Properly group characteristics into single Accessories to reduce clutter in the Home app
- [ ] Support multiple accessories by registering the plugin as a Provider
- [ ] Provide forecast data

:deciduous_tree:
