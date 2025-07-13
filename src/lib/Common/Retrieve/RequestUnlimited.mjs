import ky from 'ky';
import { serializeError } from 'serialize-error';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const deepmerge = require('deepmerge');

import RequestResponseSerialize from './RequestResponseSerialize.mjs';

if (global.logger === undefined) {
    const { default: Logger } = await import('../Loggers/LoggerDummy.mjs');
    global.logger = new Logger();
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
            timeout: 10000, // 10 seconds
            limit: 2,
            methods: ['get', 'post'],
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
        },
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
        const kyOptions = deepmerge(this.defaults, options);

        try {
            const request = ky.create(kyOptions);
            const responseObject = await request(url);
            const response = await RequestResponseSerialize.serialize(responseObject);
            return { status: 'success', value: response };
        } catch (error) {
            const serializedError = serializeError(error);
            global.logger.warn('RequestUnlimited: Error occurred during API request:', serializedError);
            return { status: 'error', reason: serializedError };
        };

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
            global.logger.error('RequestUnlimited: Unexpected rejection in RequestUnlimited.endPoint:', result.reason);
            return { status: 'error', reason: serializeError(result.reason) };
        });
    } // endPoints

} // RequestUnlimited

// const resp = await RequestUnlimited.endPoint('https://jsonplaceholder.typicode.com/posts/1');
// console.log(resp);