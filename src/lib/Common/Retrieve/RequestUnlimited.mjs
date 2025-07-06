import ky from 'ky';
import { serializeError } from 'serialize-error';
import Response from './Response.mjs';
import LoggerDummy from '../Loggers/LoggerDummy.mjs';

if (typeof global.logger === 'undefined') {
    global.logger = new LoggerDummy();
}

/**
 * A static class to handle unlimited GET requests using the `ky` library.
 * It provides robust error handling, response serialization, and retry logic.
 * All methods are designed to be non-throwing, returning serialized error objects on failure.
 * @class RequestUnlimited
 */
export default class RequestUnlimited {

    /**
     * Default configuration for ky requests, including retry logic and hooks.
     * @type {{retry: {limit: number, methods: string[], backoffLimit: number}, hooks: {beforeError: Function[]}}}
     */
    static defaults = {
        retry: {
            limit: 2,
            methods: ['get'],
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

    /**
     * Makes an HTTP request to a single URL.
     * It handles response serialization and error handling, always resolving the promise.
     *
     * @static
     * @async
     * @param {string} url - The URL to retrieve data from.
     * @param {object} [options={}] - Optional options for the request, mirroring `ky` options.
     * @param {string} [options.method='get'] - The HTTP method to use (e.g., 'get', 'post', 'put').
     * @param {any} [options.body] - The request body for methods like POST or PUT.
     * @param {Object<string, string>} [options.headers] - Headers to include in the request.
     * @param {Object} [options.retry] - Custom `ky` retry configuration.
     * @returns {Promise<Object>} A promise that resolves to the serialized response object or a serialized error object.
     */
    static async endPoint(url, options = {}) {
        // Separate ky.create options from the per-request options (method, body, json, etc.)
        const { retry, headers, ...requestOptions } = options;

        // Default to 'get' if no method is specified
        if (!requestOptions.method) {
            requestOptions.method = 'get';
        }

        const kyOptions = {
                retry: retry || this.defaults.retry,
                hooks: this.defaults.hooks
            };
        if (headers) kyOptions.headers = headers; // Add headers to the ky instance configuration

        try {
            const request = ky.create(kyOptions);
            const responseObject = await request(url, requestOptions);
            const response = await Response.serialize(responseObject);
            return response;
        } catch (error) {
            const serializedError = serializeError(error);
            global.logger.warn(`${this.name}: Error occurred during API request:`, error);
            return serializedError;
        }
    } // endPoint

    /**
     * Makes parallel HTTP requests to the specified URLs and returns the serialized responses.
     * It uses Promise.allSettled to ensure all requests are processed, even if some fail.
     *
     * @static
     * @async
     * @param {string[]} urls - An array of URLs to retrieve data from.
     * @param {object} [options={}] - Optional options to apply to all requests, mirroring `ky` options (method, body, headers, etc.).
     * @returns {Promise<Array<Object>>} A promise that resolves to an array of serialized responses or error objects.
     */
    static async endPoints(urls, options = {}) {
        const promises = urls.map(url => this.endPoint(url, options));
        const results = await Promise.allSettled(promises);

        return results.map(result => {
            if (result.status === 'fulfilled') {
                return result.value;
            }

            // This block is a safeguard. The `endPoint` method is designed to always resolve.
            // However, if it were to reject unexpectedly, we log it and return a serialized error.
            global.logger.error(`${this.name}: Unexpected rejection in RequestUnlimited.endPoint:`, result.reason);
            return serializeError(result.reason);
        });
    } // endPoints

} // RequestUnlimited