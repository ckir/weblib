import ky from 'ky';
import { serializeError } from 'serialize-error';
import Response from './Response.mjs';
import LoggerDummy from '../Loggers/LoggerDummy.mjs';

if (typeof global.logger === 'undefined') {
    global.logger = new LoggerDummy();
}

/**
 * Class to handle a single unlimited request.
 * It uses the ky library for HTTP requests and handles serialization of responses.
 * It includes retry logic and error handling.
 * 
 * @class RequestUnlimited
 * @static
 * @property {Object} defaults - Default configuration for retries and hooks.
 * @property {Object} defaults.retry - Default retry configuration.
 * @property {number} defaults.retry.limit - Maximum number of retry attempts.
 * @property {Array} defaults.retry.methods - HTTP methods to retry.
 * @property {number} defaults.retry.backoffLimit - Maximum backoff time between retries in milliseconds.
 * @property {Object} defaults.hooks - Default hooks for error handling.
 * @property {Array} defaults.hooks.beforeError - Hooks to execute before an error is thrown.
 * @method endPoint - Makes a GET request to the specified URL and returns the serialized response
 * or an error object if the request fails.
 * @param {string} url - The URL to retrieve data from.
 * @param {Object|null} [retry=null] - Optional retry configuration. If not provided, defaults will be used.
 * @returns {Promise<Object>} - A promise that resolves to the serialized response or an error object.
 * @throws {Error} - Throws an error if the request fails and cannot be serialized.
 * s
 */
export default class RequestUnlimited {

    static defaults = {
        retry: {
            limit: 2,
            methods: ['get'],
            // statusCodes: [413],
            backoffLimit: 3000
        },
        hooks: {
            beforeError: [
                error => {
                    const { response } = error;
                    if (response && response.body) {
                        error.status = response.status;
                    }

                    return error;
                }
            ]
        }
    }

    static async endPoint(url, headers = null, retry = null) {

        let request;
        // let response;

        const kyOptions = {
                retry: retry || this.defaults.retry,
                hooks: this.defaults.hooks
            };
        if (headers) kyOptions.headers = headers;

        try {
            request = ky.create(kyOptions);

            const responseObject = await request(url);
            const response = await Response.serialize(responseObject);
            return response;
        } catch (error) {
            const serializedError = serializeError(error);
            global.logger.warn('Error occurred during API request:', error);
            return serializedError;
        }
    }

} // RequestUnlimited