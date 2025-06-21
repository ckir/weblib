// example_with_retry.js
import KyQueueCombiner from './ky-queue-combiner.mjs';

// --- Mock Ky Implementation (copied from test_no_external_packages.js for standalone example) ---
const mockResponses = new Map();
const mockKy = async (url, options = {}) => {
    if (options.timeout) {
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => {
                const error = new Error(`The operation timed out.`);
                error.name = 'TimeoutError';
                reject(error);
            }, options.timeout)
        );
        const responsePromise = new Promise((resolve, reject) => {
            const matchingResponse = Array.from(mockResponses.entries()).find(([key]) => key === url);
            if (matchingResponse) {
                const [_, responseData] = matchingResponse;
                setTimeout(() => {
                    if (responseData.status >= 400) {
                        const error = new Error(`${responseData.status} ${responseData.statusText}`);
                        Object.assign(error, { response: { status: responseData.status } });
                        reject(error);
                    } else {
                        resolve({
                            json: () => Promise.resolve(responseData.body),
                            status: responseData.status
                        });
                    }
                }, responseData.delay || 0);
            } else {
                reject(new Error(`No mock response for ${url}`));
            }
        });
        return Promise.race([responsePromise, timeoutPromise]);
    }

    return new Promise((resolve, reject) => {
        const matchingResponse = Array.from(mockResponses.entries()).find(([key]) => key === url);
        if (matchingResponse) {
            const [_, responseData] = matchingResponse;
            setTimeout(() => {
                if (responseData.status >= 400) {
                    const error = new Error(`${responseData.status} ${responseData.statusText}`);
                    Object.assign(error, { response: { status: responseData.status } });
                    reject(error);
                } else {
                    resolve({
                        json: () => Promise.resolve(responseData.body),
                        status: responseData.status
                    });
                }
            }, responseData.delay || 0);
        } else {
            reject(new Error(`No mock response defined for ${url}`));
        }
    });
};

mockKy.mock = (url, status, body, statusText = '', delay = 0) => {
    mockResponses.set(url, { status, body, statusText, delay });
};

// Error constructor for HTTP errors from Ky (also copied for consistency)
class HTTPError extends Error {
    constructor(response) {
        super(`HTTPError: ${response.status} ${response.statusText}`);
        this.name = 'HTTPError';
        this.response = response;
    }
}
mockKy.HTTPError = HTTPError;

// --- End Mock Ky Implementation ---


// Flaky endpoint simulation
let flakyRequestAttempts = 0;
const MAX_FLAKY_ATTEMPTS = 2; // Will fail 2 times, succeed on 3rd attempt

/**
 * Simulates a flaky endpoint that fails a few times then succeeds.
 * @param {string} url
 * @param {object} options
 */
const mockFlakyEndpoint = async (url, options) => {
    flakyRequestAttempts++;
    console.log(`  Mock server received request for ${url}. Attempt: ${flakyRequestAttempts}`);

    if (flakyRequestAttempts <= MAX_FLAKY_ATTEMPTS) {
        console.log(`  Mock server returning 500 for ${url}.`);
        const error = new Error('Simulated Internal Server Error');
        Object.assign(error, { response: { status: 500, statusText: 'Internal Server Error' } });
        throw error; // Throw an error that ky would typically throw for a 500
    } else {
        console.log(`  Mock server returning 200 for ${url}.`);
        return {
            json: () => Promise.resolve({ message: 'Success after retries!', attempts: flakyRequestAttempts }),
            status: 200
        };
    }
};

async function runExample() {
    console.log('--- Starting KyQueueCombiner Retry Example with allSettled ---');

    // Reset KyQueueCombiner's internal state and inject our mockKy
    KyQueueCombiner.__test__resetQueues(); // Clear module-level queues
    // Custom logic to handle both stable and flaky endpoints
    KyQueueCombiner.setKyInstance(async (url, options) => {
        if (url === 'http://stable-api.example.com/data') {
            console.log(`  Mock server received request for ${url}. Returning 200.`);
            return {
                json: () => Promise.resolve({ message: 'Stable API Success' }),
                status: 200
            };
        } else if (url === 'http://flaky-api.example.com/data') {
            return mockFlakyEndpoint(url, options);
        } else {
            console.log(`  Mock server received request for unknown URL: ${url}. Returning 404.`);
            const error = new Error('Not Found');
            Object.assign(error, { response: { status: 404, statusText: 'Not Found' } });
            throw error;
        }
    });


    // Initialize the combiner with retry options
    const combiner = new KyQueueCombiner({
        kyDefaults: {
            retry: {
                limit: 3, // Retry up to 3 times (total 4 attempts: 1 initial + 3 retries)
                methods: ['get'], // Only retry GET requests
                statusCodes: [500], // Retry on 500 status code
                // backoff: { delay: 1000 } // You can also customize backoff strategy
            },
            timeout: 5000 // Global timeout for each attempt
        }
    });

    // --- Event Listeners ---
    combiner.on('request:start', ({ url, hostname }) => {
        console.log(`[${hostname}] Starting request: ${url}`);
    });
    combiner.on('request:success', ({ url, hostname, status }) => {
        console.log(`[${hostname}] Successfully fetched ${url} (Status: ${status})`);
    });
    combiner.on('request:error', ({ url, hostname, error }) => {
        // Now, the 'error' object here (which is already serialized) will have a 'url' property
        console.error(`[${hostname}] Error fetching ${url} (from event): ${error.message} - URL: ${error.url || 'N/A'}`);
    });
    combiner.on('fetchAll:complete', ({ successful, failed }) => {
        console.log(`\n✅ fetchAll completed! Successful: ${successful}, Failed: ${failed}`);
    });
    combiner.on('fetchAll:error', ({ message, successful, failed, errors }) => {
        console.error(`\n❌ fetchAll encountered a batch error: ${message}`);
        console.error(`  Successful: ${successful}, Failed: ${failed}`);
        errors.forEach((err, index) => console.error(`  Error ${index + 1}:`, JSON.stringify(err, null, 2)));
    });

    const requests = [
        { url: 'http://flaky-api.example.com/data' },
        { url: 'http://stable-api.example.com/data' },
        { url: 'http://unknown-api.example.com/data' } // This will intentionally cause a non-retryable 404
    ];

    try {
        console.log('\n--- Calling fetchAll with a mix of flaky, stable, and failing requests ---');
        const results = await combiner.fetchAll(requests); // This will now ALWAYS resolve

        console.log('\n--- All Settled Responses Received ---');
        results.forEach((result, index) => {
            console.log(`Request ${index + 1} Status: ${result.status}`);
            if (result.status === 'fulfilled') {
                console.log('  Value:', JSON.stringify(result.value));
            } else {
                console.log('  Reason (Serialized Error):', JSON.stringify(result.reason, null, 2));
                // Accessing the URL from the serialized error reason
                console.log('  Failing URL (from reason):', result.reason.url || 'N/A');
            }
        });

    } catch (error) {
        // This catch block will typically NOT be hit unless there's a fundamental issue
        // with Promise.allSettled itself or an error outside the promise rejections.
        console.error('\nCaught unexpected top-level error from fetchAll:', error.message);
    } finally {
        console.log('\n--- KyQueueCombiner Retry Example Finished ---');
    }
}

runExample();
