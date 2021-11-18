const https = require('https');
const { URLSearchParams } = require('url');

const OPENWEATHER_API_BASE_URL = 'https://api.openweathermap.org/data/2.5';

/**
 * Makes a GET request to the OpenWeather API.
 * 
 * @param {string} path API resource to fetch
 * @param {object} query Hash of params to send.
 * @returns {Promise} Thenable wrapper for the asynchronous request.
 */
function get (path, query) {
    const params = new URLSearchParams(query);

    return new Promise((resolve, reject) => {
        const req = https.get(`${OPENWEATHER_API_BASE_URL}/${path}?${params}`, (res) => {
            let output = '';

            res.setEncoding('utf8');

            res.on('data', (chunk) => {
                output += chunk;
            });

            res.on('end', () => {
                resolve(JSON.parse(output));
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        req.end();
    });
}

module.exports = {
    get,
};
