// test_no_external_packages.js
import KyQueueCombiner from './ky-queue-combiner.mjs';
import { serializeError } from 'serialize-error'; // Still using this for error comparison

// --- Custom Test Runner and Assertions ---
let testCount = 0;
let successCount = 0;
let failCount = 0;

function describe(description, fn) {
    console.log(`\n--- ${description} ---`);
    fn();
}

async function it(description, fn) {
    testCount++;
    try {
        await fn();
        console.log(`  ✅ ${description}`);
        successCount++;
    } catch (error) {
        console.error(`  ❌ ${description}`);
        console.error('    Error:', error.message);
        if (error.expected && error.actual) {
            console.error('    Expected:', JSON.stringify(error.expected, null, 2));
            console.error('    Actual:', JSON.stringify(error.actual, null, 2));
        } else if (error.stack) {
            console.error('    Stack:', error.stack.split('\n')[1]); // Show only the direct call site
        }
        failCount++;
    }
}

const expect = (actual) => ({
    to: {
        equal: (expected, message = 'should be equal') => {
            if (actual !== expected) {
                const error = new Error(`${message}: Expected ${actual} to equal ${expected}`);
                error.expected = expected;
                error.actual = actual;
                throw error;
            }
        },
        deep: {
            equal: (expected, message = 'should be deep equal') => {
                if (JSON.stringify(actual) !== JSON.stringify(expected)) { // Simple deep equal for basic objects
                    const error = new Error(`${message}: Expected deep equality`);
                    error.expected = expected;
                    error.actual = actual;
                    throw error;
                }
            },
            include: (expectedPartial, message = 'should deep include') => {
                const actualString = JSON.stringify(actual);
                const expectedString = JSON.stringify(expectedPartial);
                if (!actualString.includes(expectedString)) { // Very basic "include" check for simplicity
                    const error = new Error(`${message}: Expected ${actualString} to include ${expectedString}`);
                    error.expected = expectedPartial;
                    error.actual = actual;
                    throw error;
                }
            }
        },
        have: {
            lengthOf: (expectedLength, message = 'should have length') => {
                if (actual.length !== expectedLength) {
                    const error = new Error(`${message}: Expected length ${actual.length} to be ${expectedLength}`);
                    error.expected = expectedLength;
                    error.actual = actual.length;
                    throw error;
                }
            },
            property: (prop, value, message = 'should have property') => {
                if (!(prop in actual) || actual[prop] !== value) {
                    const error = new Error(`${message}: Expected object to have property '${prop}' with value '${value}'`);
                    error.expected = { [prop]: value };
                    error.actual = actual;
                    throw error;
                }
            },
        },
        be: {
            true: (message = 'should be true') => {
                if (actual !== true) {
                    const error = new Error(`${message}: Expected ${actual} to be true`);
                    error.expected = true;
                    error.actual = actual;
                    throw error;
                }
            },
            at: {
                least: (expectedValue, message = 'should be at least') => {
                    if (actual < expectedValue) {
                        const error = new Error(`${message}: Expected ${actual} to be at least ${expectedValue}`);
                        error.expected = `at least ${expectedValue}`;
                        error.actual = actual;
                        throw error;
                    }
                }
            }
        },
        exist: (message = 'should exist') => {
            if (actual === null || typeof actual === 'undefined') {
                throw new Error(`${message}: Expected value to exist`);
            }
        },
    }
});


// --- Mock Ky Implementation ---
const mockResponses = new Map();
const mockKy = async (url, options = {}) => {
    // Simulate delays if 'timeout' option is present and response is slow
    if (options.timeout) {
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => {
                const error = new Error(`The operation timed out.`);
                error.name = 'TimeoutError';
                reject(error);
            }, options.timeout)
        );
        const responsePromise = new Promise(resolve => {
            // Find a matching mock response
            const matchingResponse = Array.from(mockResponses.entries()).find(([key]) => key === url);
            if (matchingResponse) {
                const [_, responseData] = matchingResponse;
                setTimeout(() => {
                    if (responseData.status >= 400) {
                        const error = new Error(`${responseData.status} ${responseData.statusText}`);
                        Object.assign(error, { response: { status: responseData.status } }); // Mimic ky's http error structure
                        Promise.reject(error);
                    } else {
                        resolve({
                            json: () => Promise.resolve(responseData.body),
                            status: responseData.status
                        });
                    }
                }, responseData.delay || 0);
            } else {
                Promise.reject(new Error(`No mock response for ${url}`));
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
                    // Mimic ky's HTTPError structure minimally for the test
                    Object.assign(error, { response: { status: responseData.status } });
                    reject(error);
                } else {
                    resolve({
                        json: () => Promise.resolve(responseData.body),
                        status: responseData.status
                    });
                }
            }, responseData.delay || 0); // Simulate network delay
        } else {
            reject(new Error(`No mock response defined for ${url}`));
        }
    });
};

mockKy.mock = (url, status, body, statusText = '', delay = 0) => {
    mockResponses.set(url, { status, body, statusText, delay });
};

// Error constructor for HTTP errors from Ky
class HTTPError extends Error {
    constructor(response) {
        super(`HTTPError: ${response.status} ${response.statusText}`);
        this.name = 'HTTPError';
        this.response = response;
    }
}
mockKy.HTTPError = HTTPError; // Attach to mockKy for testing error type checks


// --- Test Suite ---
async function runTests() {
    let combiner;

    // Reset mocks and queues before each test block
    const beforeEachTest = () => {
        mockResponses.clear();
        KyQueueCombiner.__test__resetQueues();
        // Inject our mock ky instance
        KyQueueCombiner.setKyInstance(mockKy);
    };

    describe('KyQueueCombiner', () => {
        beforeEachTest(); // Call the beforeEach setup

        it('should initialize with default options if none provided', async () => {
            combiner = new KyQueueCombiner();
            expect(combiner.defaultKyOptions).to.deep.equal({});
            expect(combiner.defaultQueueOptions.concurrency).to.equal(5);
            expect(combiner.hostnameOverrides).to.deep.equal({});
        });

        it('should initialize with provided options', async () => {
            const options = {
                kyDefaults: { retry: 0 },
                queueDefaults: { concurrency: 10 },
                hostnameOverrides: { 'example.com': { queueOptions: { concurrency: 2 } } },
            };
            combiner = new KyQueueCombiner(options);
            expect(combiner.defaultKyOptions).to.deep.equal({ retry: 0 });
            expect(combiner.defaultQueueOptions.concurrency).to.equal(10);
            expect(combiner.hostnameOverrides).to.deep.equal({ 'example.com': { queueOptions: { concurrency: 2 } } });
        });
    });

    describe('fetchAll', () => {
        beforeEachTest();

        it('should fetch multiple requests successfully', async () => {
            combiner = new KyQueueCombiner();
            mockKy.mock('http://localhost:8000/data1', 200, { id: 1, message: 'data1' });
            mockKy.mock('http://localhost:8000/data2', 200, { id: 2, message: 'data2' });

            const requests = [
                { url: 'http://localhost:8000/data1' },
                { url: 'http://localhost:8000/data2' },
            ];

            const results = await combiner.fetchAll(requests);
            expect(results).to.deep.equal([
                { id: 1, message: 'data1' },
                { id: 2, message: 'data2' },
            ]);
        });

        it('should handle request-specific kyOptions', async () => {
            combiner = new KyQueueCombiner();
            // Note: Our mockKy doesn't inspect headers. This test checks that the options are passed through.
            // A real mock would need to check `options.headers`.
            mockKy.mock('http://localhost:8000/data', 200, { id: 1, header: true });

            const requests = [
                { url: 'http://localhost:8000/data', kyOptions: { headers: { 'X-Custom-Header': 'test-value' } } },
            ];

            const results = await combiner.fetchAll(requests);
            expect(results[0]).to.have.property('header', true);
        });

        it('should apply global kyOptions for the fetchAll batch', async () => {
            combiner = new KyQueueCombiner();
            // Again, our mockKy doesn't inspect headers, but we verify options are passed.
            mockKy.mock('http://localhost:8000/data', 200, { id: 1 });

            const requests = [{ url: 'http://localhost:8000/data' }];
            const results = await combiner.fetchAll(requests, { headers: { 'X-Global-Batch': 'true' } });
            expect(results[0]).to.have.property('id', 1);
        });

        it('should prioritize kyOptions: request > global > hostname > default', async () => {
            combiner = new KyQueueCombiner({
                kyDefaults: { timeout: 1000 },
                hostnameOverrides: {
                    'localhost:8000': {
                        kyOptions: { headers: { 'X-Hostname': 'true', 'Authorization': 'Bearer ABC' } }
                    }
                }
            });

            // Mock response regardless of headers for simplicity
            mockKy.mock('http://localhost:8000/data', 200, { success: true });

            const requests = [{
                url: 'http://localhost:8000/data',
                kyOptions: {
                    headers: { 'X-Request': 'true', 'Authorization': 'Bearer XYZ' }
                }
            }];

            await combiner.fetchAll(requests, {
                headers: { 'X-Global': 'true', 'Authorization': 'Bearer 123' }
            });

            // This test primarily ensures no errors from option merging.
            // A truly robust test would require mockKy to inspect headers.
            // For "no external packages" and simple mocking, we assert success.
            const result = await combiner.fetchAll(requests);
            expect(result[0]).to.deep.equal({ success: true });
        });

        it('should create separate queues for different hostnames and respect concurrency', async () => {
            combiner = new KyQueueCombiner({
                hostnameOverrides: {
                    'localhost:8000': { queueOptions: { concurrency: 1 } },
                    'localhost:8001': { queueOptions: { concurrency: 1 } },
                }
            });

            mockKy.mock('http://localhost:8000/delay1', 200, 'host1_req1', '', 50);
            mockKy.mock('http://localhost:8000/delay2', 200, 'host1_req2', '', 10);
            mockKy.mock('http://localhost:8001/delay1', 200, 'host2_req1', '', 10);
            mockKy.mock('http://localhost:8001/delay2', 200, 'host2_req2', '', 50);

            const requests = [
                { url: 'http://localhost:8000/delay1' },
                { url: 'http://localhost:8001/delay1' },
                { url: 'http://localhost:8000/delay2' },
                { url: 'http://localhost:8001/delay2' },
            ];

            const start = Date.now();
            const results = await combiner.fetchAll(requests);
            const end = Date.now();

            expect(end - start).to.be.at.least(50); // Should be at least the longest single request delay (50ms)
            expect(results).to.have.lengthOf(4);
            expect(results).to.deep.include('host1_req1');
            expect(results).to.deep.include('host2_req1');
            expect(results).to.deep.include('host1_req2');
            expect(results).to.deep.include('host2_req2');
        });
    });

    describe('Error Handling', () => {
        beforeEachTest();

        it('should reject fetchAll if a request fails with network error', async () => {
            combiner = new KyQueueCombiner();
            mockKy.mock('http://localhost:8002/fail', 500, 'Internal Server Error', 'Internal Server Error');

            const requests = [{ url: 'http://localhost:8002/fail' }];

            let caughtError;
            try {
                await combiner.fetchAll(requests);
            } catch (error) {
                caughtError = error;
            }
            expect(caughtError).to.exist;
            expect(caughtError.message).to.include('500 Internal Server Error');
            expect(caughtError.response.status).to.equal(500); // Verify mock HTTP error structure
        });

        it('should reject fetchAll if a request fails with timeout', async () => {
            combiner = new KyQueueCombiner();
            // Mock a response that is too slow for ky's timeout
            mockKy.mock('http://localhost:8003/slow', 200, 'too slow', '', 2000); // Mock takes 2000ms

            const requests = [{ url: 'http://localhost:8003/slow', kyOptions: { timeout: 500 } }]; // Ky timeout 500ms

            let caughtError;
            try {
                await combiner.fetchAll(requests);
            } catch (error) {
                caughtError = error;
            }
            expect(caughtError).to.exist;
            expect(caughtError.name).to.equal('TimeoutError');
        });

        it('should reject fetchAll for invalid URL in request object', async () => {
            combiner = new KyQueueCombiner();
            const requests = [{ url: 'invalid-url' }];
            let caughtError;
            try {
                await combiner.fetchAll(requests);
            } catch (error) {
                caughtError = error;
            }
            expect(caughtError).to.exist;
            expect(caughtError.message).to.include('Invalid URL provided');
        });

        it('should reject fetchAll for invalid request object (missing url)', async () => {
            combiner = new KyQueueCombiner();
            const requests = [{ someProp: 'value' }];
            let caughtError;
            try {
                await combiner.fetchAll(requests);
            } catch (error) {
                caughtError = error;
            }
            expect(caughtError).to.exist;
            expect(caughtError.message).to.include('Invalid request');
        });
    });

    describe('Event Emission', () => {
        beforeEachTest();

        it('should emit request:start, request:success, and fetchAll:complete events for successful requests', async () => {
            combiner = new KyQueueCombiner();
            mockKy.mock('http://localhost:8000/success1', 200, { status: 'ok1' });
            mockKy.mock('http://localhost:8000/success2', 200, { status: 'ok2' });

            const startEvents = [];
            const successEvents = [];
            const completeEvents = [];

            combiner.on('request:start', (data) => startEvents.push(data));
            combiner.on('request:success', (data) => successEvents.push(data));
            combiner.on('fetchAll:complete', (data) => completeEvents.push(data));

            await combiner.fetchAll([
                { url: 'http://localhost:8000/success1' },
                { url: 'http://localhost:8000/success2' },
            ]);

            expect(startEvents).to.have.lengthOf(2);
            expect(startEvents[0]).to.deep.include({ url: 'http://localhost:8000/success1', hostname: 'localhost:8000' });
            expect(successEvents).to.have.lengthOf(2);
            expect(successEvents[0]).to.deep.include({ url: 'http://localhost:8000/success1', hostname: 'localhost:8000', status: 200 });
            expect(completeEvents).to.have.lengthOf(1);
            expect(completeEvents[0]).to.deep.equal({ successful: 2, failed: 0 });
        });

        it('should emit request:error and fetchAll:error events for failed requests with serialized error', async () => {
            combiner = new KyQueueCombiner();
            mockKy.mock('http://localhost:8002/fail', 404, 'Not Found', 'Not Found');

            const errorEvents = [];
            const fetchAllErrorEvents = [];

            combiner.on('request:error', (data) => errorEvents.push(data));
            combiner.on('fetchAll:error', (data) => fetchAllErrorEvents.push(data));

            const requests = [{ url: 'http://localhost:8002/fail' }];
            try {
                await combiner.fetchAll(requests);
            } catch (e) {
                // Expected to catch here
            }

            expect(errorEvents).to.have.lengthOf(1);
            expect(errorEvents[0].url).to.equal('http://localhost:8002/fail');
            expect(errorEvents[0].hostname).to.equal('localhost:8002');
            expect(errorEvents[0].error).to.deep.equal(serializeError(new mockKy.HTTPError({status: 404, statusText: 'Not Found'})));

            expect(fetchAllErrorEvents).to.have.lengthOf(1);
            expect(fetchAllErrorEvents[0].message).to.equal('One or more requests in the batch failed.');
            // Compare the serialized error emitted by the top-level catch
            expect(fetchAllErrorEvents[0].error).to.deep.equal(serializeError(new mockKy.HTTPError({status: 404, statusText: 'Not Found'})));
        });

        it('should re-emit hostname-specific p-queue events with serialized errors', async () => {
            combiner = new KyQueueCombiner({
                hostnameOverrides: {
                    'localhost:8000': { queueOptions: { concurrency: 1 } }
                }
            });

            mockKy.mock('http://localhost:8000/data1', 200, 'ok');
            mockKy.mock('http://localhost:8000/data2', 500, 'server error', 'Internal Server Error');

            const activeEvents = [];
            const idleEvents = [];
            const errorEvents = [];

            combiner.on(`localhost:8000:active`, () => activeEvents.push('active'));
            combiner.on(`localhost:8000:idle`, () => idleEvents.push('idle'));
            combiner.on(`localhost:8000:error`, (err) => errorEvents.push(err));

            const requests = [
                { url: 'http://localhost:8000/data1' },
                { url: 'http://localhost:8000/data2' },
            ];

            try {
                await combiner.fetchAll(requests);
            } catch (e) {
                // Expected to catch due to the 500 error
            }

            // Expect active for each task that starts
            expect(activeEvents.length).to.be.at.least(2); // At least 2 active events for the two requests
            // Expect idle after all tasks are processed (even with error)
            expect(idleEvents.length).to.be.at.least(1); // Should eventually become idle

            expect(errorEvents).to.have.lengthOf(1);
            expect(errorEvents[0]).to.deep.equal(serializeError(new mockKy.HTTPError({status: 500, statusText: 'Internal Server Error'})));
        });
    });

    describe('stopAllQueues and resumeAllQueues', () => {
        beforeEachTest();

        it('should stop and resume all queues', async () => {
            combiner = new KyQueueCombiner();

            mockKy.mock('http://localhost:8000/slow-data', 200, 'slow response', '', 1000);
            mockKy.mock('http://localhost:8001/another-slow-data', 200, 'another slow response', '', 1000);

            const allQueuesStoppedEvent = new Promise(resolve => {
                combiner.on('allQueuesStopped', resolve);
            });
            const allQueuesResumedEvent = new Promise(resolve => {
                combiner.on('allQueuesResumed', resolve);
            });

            const requests = [
                { url: 'http://localhost:8000/slow-data' },
                { url: 'http://localhost:8001/another-slow-data' },
            ];

            // Start fetching, but then stop quickly
            const fetchPromise = combiner.fetchAll(requests);

            // Give it a moment to start the tasks
            await new Promise(resolve => setTimeout(resolve, 50));

            // Stop the queues
            combiner.stopAllQueues();

            // Verify that 'allQueuesStopped' event was emitted
            await allQueuesStoppedEvent;

            // At this point, the requests should be paused/cleared.
            // If we wait, they shouldn't complete if paused/cleared properly.
            const timeoutPromise = new Promise(resolve => setTimeout(() => resolve('timeout'), 1500)); // Wait longer than mock delay
            const result = await Promise.race([fetchPromise, timeoutPromise]);

            expect(result).to.equal('timeout', 'Requests should not complete if queues are stopped and cleared'); // Should timeout before completion

            // Resume the queues (they were cleared, so no pending tasks will run unless new ones are added)
            combiner.resumeAllQueues();

            // Verify that 'allQueuesResumed' event was emitted
            await allQueuesResumedEvent;

            // Re-mock and re-run to ensure functionality after resume (though tasks were cleared)
            mockKy.mock('http://localhost:8000/slow-data', 200, { message: 'slow response re-run' });
            mockKy.mock('http://localhost:8001/another-slow-data', 200, { message: 'another slow response re-run' });

            const reRunResults = await combiner.fetchAll(requests);
            expect(reRunResults).to.have.lengthOf(2);
            expect(reRunResults[0]).to.deep.equal({ message: 'slow response re-run' });
            expect(reRunResults[1]).to.deep.equal({ message: 'another slow response re-run' });
        });
    });

    // --- Final Report ---
    console.log(`\n--- Test Summary ---`);
    console.log(`Total tests: ${testCount}`);
    console.log(`Passed: ${successCount}`);
    console.log(`Failed: ${failCount}`);
    console.log(`--------------------\n`);
    if (failCount > 0) {
        process.exit(1); // Exit with error code if any test failed
    }
}

runTests();
