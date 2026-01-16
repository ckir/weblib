import { URL } from 'node:url'; // Node.js built-in module
import EventEmitter from 'node:events'; // Node.js built-in module

import ky from 'ky';
import PQueue from 'p-queue';
import { serializeError } from 'serialize-error'; // Import serialize-error

import { merge } from "ts-deepmerge";

import RequestResponseSerialize from './RequestResponseSerialize.mjs';

if (global.logger === undefined) {
    const { default: Logger } = await import('../Loggers/LoggerDummy.mjs');
    global.logger = new Logger();
}


/**
 * @typedef {Object} RequestObject
 * @property {string} url - The URL to fetch.
 * @property {Object} [kyOptions] - Ky options specific to this request.
 */

/**
 * @typedef {Object} ConstructorOptions
 * @property {Object} [kyDefaults] - Default Ky options applied to all requests.
 * @property {Object} [queueDefaults] - Default P-Queue options applied to all queues.
 * @property {Object.<string, HostnameOverrideOptions>} [hostnameOverrides] - Per-hostname override options.
 */

/**
 * @typedef {Object} HostnameOverrideOptions
 * @property {Object} [kyOptions] - Ky options specific to this hostname.
 * @property {Object} [queueOptions] - P-Queue options specific to this hostname.
 */

// Module-level map to store PQueue instances, keyed by hostname.
// This makes the queues shared across all instances of RequestLimited.
let queues = new Map();

// Internal reference to the ky instance, defaults to the imported one.
// This allows a test environment to inject a mock ky.
let currentKyInstance = ky;

/**
 * `RequestLimited` combines the capabilities of the `ky` HTTP client with `p-queue`
 * for concurrency control, managing separate queues for each hostname.
 * It extends `EventEmitter` to re-transmit events from underlying queues and requests.
 */
class RequestLimited extends EventEmitter {

    defaults = {
        kyOptions: {
            timeout: 50000, // 50 seconds
            retry: {
                limit: 5,
                methods: ['get', 'post'],
                backoffLimit: 3000
            },
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            hooks: {
                hooks: {
                    beforeRetry: [
                        (options, error, retryCount) => {
                            global.logger.silly('Retrying API call, retry count: ' + retryCount);
                        }
                    ]
                },
            }
        },
        queueOptions: {
            concurrency: 5, // A reasonable default concurrency limit
        },
        hostnameOverrides: {}
    }

    /**
     * Creates an instance of RequestLimited.
     * @param {ConstructorOptions} [kyOptions={}] - Options to configure default settings and hostname-specific overrides.
     */
    constructor(options = { kyOptions: {}, queueOptions: {}, hostnameOverrides: {} }) {
        super();

        // Default global Ky options
        this.defaultKyOptions = merge.withOptions({ mergeArrays: false }, this.defaults.kyOptions, options.kyOptions);
        // this.defaultKyOptions = merge(this.defaults.ky, kyOptions.kyDefaults || {});

        // Default global P-Queue options. Concurrency is key here.
        this.defaultQueueOptions = merge.withOptions({ mergeArrays: false }, this.defaults.queueOptions, options.queueOptions);

        // Per-hostname overrides for both Ky and P-Queue options
        this.hostnameOverrides = merge.withOptions({ mergeArrays: false }, this.defaults.hostnameOverrides, options.hostnameOverrides);

        // Bind methods to the instance to ensure `this` context is correct
        this.fetchAll = this.fetchAll.bind(this);
        this._getOrCreateQueue = this._getOrCreateQueue.bind(this);
        this._setupQueueEventForwarding = this._setupQueueEventForwarding.bind(this);
        this.stopAllQueues = this.stopAllQueues.bind(this);
        this.resumeAllQueues = this.resumeAllQueues.bind(this);
    }

    /**
     * Allows injecting a mock ky instance for testing purposes.
     * @param {function} mockKy - A mock ky function.
     */
    static setKyInstance(mockKy) {
        currentKyInstance = mockKy;
    }

    /**
     * Resets the module-level queues map. For testing purposes only.
     * @private
     */
    static __test__resetQueues() {
        queues.clear();
        currentKyInstance = ky; // Reset ky instance to original
    }

    /**
     * Internal helper to retrieve an existing PQueue instance for a given hostname,
     * or create a new one if it doesn't exist.
     * Applies hostname-specific and global default queue options during creation.
     * @private
     * @param {string} hostname - The hostname for which to get or create the queue.
     * @returns {PQueue} The PQueue instance for the specified hostname.
     */
    _getOrCreateQueue(hostname) {
        // Use the module-level 'queues' map
        if (!queues.has(hostname)) {
            // Get hostname-specific P-Queue options
            const hostnameSpecificQueueOptions = this.hostnameOverrides[hostname]?.queueOptions || {};

            // Merge default queue options with hostname-specific overrides
            const finalQueueOptions = {
                ...this.defaultQueueOptions,
                ...hostnameSpecificQueueOptions,
            };

            const queue = new PQueue(finalQueueOptions);
            queues.set(hostname, queue); // Use module-level 'queues' map

            // Set up event forwarding from this newly created queue
            this._setupQueueEventForwarding(queue, hostname);
        }
        return queues.get(hostname); // Use module-level 'queues' map
    }

    /**
     * Sets up event forwarding from a PQueue instance to the RequestLimited instance.
     * All standard P-Queue events are re-transmitted, prefixed with the hostname.
     * @private
     * @param {PQueue} queue - The PQueue instance to listen to.
     * @param {string} hostname - The hostname associated with the queue.
     */
    _setupQueueEventForwarding(queue, hostname) {
        // Events emitted by p-queue instances
        const eventsToForward = ['active', 'idle', 'add', 'next', 'error', 'pause', 'resume', 'empty'];

        eventsToForward.forEach(event => {
            queue.on(event, (...args) => {
                // For 'error' events, serialize the error argument
                if (event === 'error' && args[0] instanceof Error) {
                    const serializedErr = serializeError(args[0]);
                    this.emit(`${hostname}:${event}`, serializedErr);
                } else {
                    // Re-emit other events as-is
                    this.emit(`${hostname}:${event}`, ...args);
                }
            });
        });
    }

    /**
     * Fetches an array of requests, using a separate `p-queue` for each hostname
     * to manage concurrency. Uses `Promise.allSettled` to return all results
     * (fulfilled or rejected) without immediately throwing on the first error.
     *
     * @param {Array<RequestObject>} requests - An array of request objects. Each object must have a 'url' property,
     * and can optionally have 'kyOptions' for request-specific Ky options.
     * @param {Object} [globalKyOptions={}] - Optional Ky options to apply globally for this batch of requests.
     * These override constructor's `defaultKyOptions` and `hostnameOverrides.kyOptions`.
     * @returns {Promise<Array<{status: 'fulfilled', value: any} | {status: 'rejected', reason: Object}>>}
     * A promise that resolves with an array of objects, each representing the outcome
     * of a request (fulfilled with data or rejected with a serialized error).
     */
    async fetchAll(requests, globalKyOptions = {}) {
        const fetchPromises = requests.map(async (request) => {
            // Basic validation for the request object
            if (!request || typeof request.url !== 'string') {
                const errorMessage = 'Invalid request: Each request must be an object with a "url" string property.';
                global.logger.error(errorMessage, request);
                const error = new Error(errorMessage);
                // Attach the URL to the error before serialization
                error.url = request ? request.url : 'N/A'; // Add URL for better context
                // Emit an error event for the invalid request, but allow the promise to reject
                this.emit('request:error', { request, error: serializeError(error), message: errorMessage, url: error.url });
                return Promise.reject(error);
            }

            let parsedUrl;
            try {
                // Parse the URL to extract the hostname
                parsedUrl = new URL(request.url);
            } catch (error) {
                const errorMessage = `Invalid URL provided: "${request.url}".`;
                global.logger.error(errorMessage, error);
                // Attach the URL to the error before serialization
                error.url = request.url; // Add URL for better context
                this.emit('request:error', { url: request.url, error: serializeError(error), message: errorMessage });
                return Promise.reject(error);
            }

            const hostname = parsedUrl.hostname;
            // Get or create the PQueue instance for this hostname
            const queue = this._getOrCreateQueue(hostname);

            // Merge Ky options in order of precedence (lowest to highest):
            // 1. `this.defaultKyOptions` (constructor defaults)
            // 2. `this.hostnameOverrides[hostname]?.kyOptions` (hostname-specific overrides)
            // 3. `globalKyOptions` (global options for this `fetchAll` call)
            // 4. `request.kyOptions` (options specific to this individual request)
            const finalKyOptions = merge.withOptions({ mergeArrays: false }, this.defaultKyOptions, this.hostnameOverrides[hostname]?.kyOptions || {}, globalKyOptions, request.kyOptions || {});

            // Add the fetch task to the queue for the respective hostname.
            // The task itself is an async function that performs the Ky fetch.
            return queue.add(async () => {
                try {
                    // Emit an event indicating that a request has started
                    this.emit('request:start', { url: request.url, hostname });

                    // Perform the HTTP request using ky, using the currentKyInstance
                    const response = await currentKyInstance(request.url, finalKyOptions);

                    // Assuming JSON response for simplicity. Adjust as needed if other formats are expected.
                    // const jsonResponse = await response.json();
                    const jsonResponse = await RequestResponseSerialize.serialize(response);

                    // Emit an event indicating successful completion of the request
                    this.emit('request:success', { url: request.url, hostname, status: response.status });
                    return jsonResponse; // This becomes the 'value' for fulfilled promises
                } catch (error) {
                    // Attach the URL to the error before serialization
                    error.url = request.url; // Add URL for better context
                    // Emit an event if the request encounters an error, serializing it
                    this.emit('request:error', { url: request.url, hostname, error: serializeError(error) });
                    global.logger.error(`Error fetching ${request.url} (Hostname: ${hostname}):`, error.message);
                    throw error; // Re-throw the error so Promise.allSettled catches it as a rejection
                }
            });
        });

        // Use Promise.allSettled to wait for all promises to settle (fulfill or reject)
        const settledResults = await Promise.allSettled(fetchPromises);

        let successfulCount = 0;
        let failedCount = 0;
        let formattedResults = settledResults.map(async (result) => {
            if (result.status === 'fulfilled') {
                successfulCount++;
                return { status: 'fulfilled', value: result.value };
            } else { // result.status === 'rejected'
                failedCount++;
                // Ensure the reason is always serialized for consistency
                const serializedReason = serializeError(result.reason);
                return { status: 'rejected', reason: serializedReason };
            }
        });
        formattedResults = await Promise.all(formattedResults);
        formattedResults = formattedResults.map(r => r.value || r.reason);

        // Emit a general event indicating overall completion with counts
        this.emit('fetchAll:complete', { successful: successfulCount, failed: failedCount });

        // Optionally, still emit a top-level error event if there were any failures
        if (failedCount > 0) {
            this.emit('fetchAll:error', {
                message: 'Some requests in the batch failed. See individual results for details.',
                successful: successfulCount,
                failed: failedCount,
                errors: formattedResults.filter(r => r.status === 'rejected').map(r => r.reason)
            });
        }

        return formattedResults;
    }

    /**
     * Pauses all active queues and clears any pending tasks.
     * This effectively stops all ongoing and future requests until `resumeAllQueues` is called.
     * @returns {void}
     */
    stopAllQueues() {
        // Use the module-level 'queues' map
        queues.forEach((queue, hostname) => {
            queue.pause(); // Pause the queue, preventing new tasks from starting
            queue.clear(); // Clear all pending tasks from the queue
            this.emit(`${hostname}:stopped`); // Custom event indicating queue has stopped
        });
        this.emit('allQueuesStopped'); // Emit a general event for all queues
    }

    /**
     * Resumes all paused queues, allowing new tasks to be processed.
     * @returns {void}
     */
    resumeAllQueues() {
        // Use the module-level 'queues' map
        queues.forEach((queue, hostname) => {
            queue.start(); // Start the queue, allowing tasks to run again
            this.emit(`${hostname}:resumed`); // Custom event indicating queue has resumed
        });
        this.emit('allQueuesResumed'); // Emit a general event for all queues
    }
}

export default RequestLimited;
