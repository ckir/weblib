import RequestLimited from './RequestLimited.mjs';
import { jest } from '@jest/globals';

// Mock the global logger to prevent console output during tests and allow spying
globalThis.logger = {
    warn: jest.fn(),
    error: jest.fn(),
};

// A helper to create a mock Ky response
const createMockKyResponse = (body, status = 200) => ({
    status,
    json: () => Promise.resolve(body),
});

// A helper to create a mock Ky error
const createMockKyError = (message, status = 500) => {
    const error = new Error(message);
    error.response = { status };
    return error;
};

describe('RequestLimited', () => {
    let mockKy;

    // Before each test, reset the module-level state and set up a fresh mockKy
    beforeEach(() => {
        RequestLimited.__test__resetQueues();
        mockKy = jest.fn();
        RequestLimited.setKyInstance(mockKy);
        jest.clearAllMocks(); // Clear mocks for logger etc.
    });

    describe('Constructor and Initialization', () => {
        it('should initialize with default options', () => {
            const rl = new RequestLimited();
            expect(rl.defaultQueueOptions.concurrency).toBe(5);
            expect(rl.defaultKyOptions.retry.limit).toBe(2);
            expect(rl.hostnameOverrides).toEqual({});
        });

        it('should merge custom queueDefaults', () => {
            const rl = new RequestLimited({
                queueDefaults: { concurrency: 10, interval: 1000 },
            });
            expect(rl.defaultQueueOptions.concurrency).toBe(10);
            expect(rl.defaultQueueOptions.interval).toBe(1000);
        });

        it('should merge custom kyDefaults', () => {
            const rl = new RequestLimited({
                kyDefaults: { timeout: 5000, headers: { 'X-Custom': 'true' } },
            });
            expect(rl.defaultKyOptions.timeout).toBe(5000);
            expect(rl.defaultKyOptions.headers).toEqual({ 'X-Custom': 'true' });
            // Ensure deep merge works and doesn't overwrite nested defaults
            expect(rl.defaultKyOptions.retry.limit).toBe(2);
        });

        it('should set hostnameOverrides', () => {
            const overrides = {
                'api.example.com': {
                    queueOptions: { concurrency: 1 },
                    kyOptions: { headers: { 'Authorization': 'Bearer token' } },
                },
            };
            const rl = new RequestLimited({ hostnameOverrides: overrides });
            expect(rl.hostnameOverrides).toEqual(overrides);
        });
    });

    describe('Queue Management', () => {
        it('should create a new queue for a new hostname', async () => {
            const rl = new RequestLimited();
            mockKy.mockResolvedValue(createMockKyResponse({ success: true }));
            await rl.fetchAll([{ url: 'https://api.example.com/data' }]);
            // Internal check, not ideal, but necessary to verify queue creation
            const queue = rl._getOrCreateQueue('api.example.com');
            expect(queue).toBeDefined();
            expect(queue.concurrency).toBe(5); // Default concurrency
        });

        it('should reuse an existing queue for the same hostname', async () => {
            const rl = new RequestLimited();
            mockKy.mockResolvedValue(createMockKyResponse({ success: true }));
            const queue1 = rl._getOrCreateQueue('api.example.com');
            await rl.fetchAll([{ url: 'https://api.example.com/data' }]);
            const queue2 = rl._getOrCreateQueue('api.example.com');
            expect(queue1).toBe(queue2);
        });

        it('should apply hostname-specific queue options', () => {
            const rl = new RequestLimited({
                hostnameOverrides: {
                    'api.example.com': { queueOptions: { concurrency: 1 } },
                },
            });
            const queue = rl._getOrCreateQueue('api.example.com');
            expect(queue.concurrency).toBe(1);
        });

        it('should share queues across different instances', () => {
            const rl1 = new RequestLimited();
            const queue1 = rl1._getOrCreateQueue('shared.example.com');

            const rl2 = new RequestLimited();
            const queue2 = rl2._getOrCreateQueue('shared.example.com');

            expect(queue1).toBe(queue2);
        });
    });

    describe('fetchAll', () => {
        it('should fetch a single URL successfully', async () => {
            const rl = new RequestLimited();
            const mockData = { id: 1, title: 'Test Post' };
            mockKy.mockResolvedValue(createMockKyResponse(mockData));

            const results = await rl.fetchAll([{ url: 'https://api.example.com/posts/1' }]);

            expect(results).toHaveLength(1);
            expect(results[0].status).toBe('fulfilled');
            expect(results[0].value).toEqual(mockData);
            expect(mockKy).toHaveBeenCalledWith('https://api.example.com/posts/1', expect.any(Object));
        });

        it('should handle a mix of successful and failed requests', async () => {
            const rl = new RequestLimited();
            const mockSuccessData = { success: true };
            const mockError = createMockKyError('Internal Server Error', 500);

            mockKy
                .mockResolvedValueOnce(createMockKyResponse(mockSuccessData))
                .mockRejectedValueOnce(mockError);

            const requests = [
                { url: 'https://api.example.com/success' },
                { url: 'https://api.example.com/fail' },
            ];

            const results = await rl.fetchAll(requests);

            expect(results).toHaveLength(2);
            expect(results[0]).toEqual({ status: 'fulfilled', value: mockSuccessData });
            expect(results[1].status).toBe('rejected');
            expect(results[1].reason.name).toBe('Error');
            expect(results[1].reason.message).toBe('Internal Server Error');
            expect(results[1].reason.url).toBe('https://api.example.com/fail');
        });

        it('should reject requests with invalid URL format', async () => {
            const rl = new RequestLimited();
            const requests = [{ url: 'not-a-valid-url' }];
            const results = await rl.fetchAll(requests);

            expect(results).toHaveLength(1);
            expect(results[0].status).toBe('rejected');
            expect(results[0].reason.name).toBe('TypeError');
            expect(results[0].reason.message).toContain('Invalid URL');
            expect(results[0].reason.url).toBe('not-a-valid-url');
        });

        it('should reject invalid request objects', async () => {
            const rl = new RequestLimited();
            mockKy.mockResolvedValue(createMockKyResponse({}));
            const requests = [
                { url: 'https://good.com' },
                { not_a_url: 'bad' }, // Invalid object
                null, // Invalid object
            ];
            const results = await rl.fetchAll(requests);

            expect(results).toHaveLength(3);
            expect(results[0].status).toBe('fulfilled');
            expect(results[1].status).toBe('rejected');
            expect(results[1].reason.message).toContain('must be an object with a "url" string property');
            expect(results[2].status).toBe('rejected');
            expect(results[2].reason.message).toContain('must be an object with a "url" string property');
        });

        it('should merge ky options correctly (global and per-request)', async () => {
            const rl = new RequestLimited({
                kyDefaults: { headers: { 'X-Default': '1' } },
                hostnameOverrides: {
                    'api.example.com': {
                        kyOptions: { headers: { 'X-Hostname': '2' } }
                    }
                }
            });

            const globalKyOptions = { headers: { 'X-Global': '3' } };
            const requestKyOptions = { headers: { 'X-Request': '4' } };

            mockKy.mockResolvedValue(createMockKyResponse({}));

            await rl.fetchAll(
                [{ url: 'https://api.example.com/test', kyOptions: requestKyOptions }],
                globalKyOptions
            );

            const expectedHeaders = {
                'X-Default': '1',
                'X-Hostname': '2',
                'X-Global': '3',
                'X-Request': '4',
            };

            expect(mockKy).toHaveBeenCalledWith(
                'https://api.example.com/test',
                expect.objectContaining({ headers: expectedHeaders })
            );
        });
    });

    describe('Event Emission', () => {
        it('should emit request lifecycle events', async () => {
            const rl = new RequestLimited();
            const startListener = jest.fn();
            const successListener = jest.fn();
            const errorListener = jest.fn();
            const completeListener = jest.fn();

            rl.on('request:start', startListener);
            rl.on('request:success', successListener);
            rl.on('request:error', errorListener);
            rl.on('fetchAll:complete', completeListener);

            mockKy
                .mockResolvedValueOnce(createMockKyResponse({}))
                .mockRejectedValueOnce(createMockKyError('Failed'));

            await rl.fetchAll([
                { url: 'https://api.example.com/one' },
                { url: 'https://api.example.com/two' },
            ]);

            expect(startListener).toHaveBeenCalledTimes(2);
            expect(startListener).toHaveBeenCalledWith({ url: 'https://api.example.com/one', hostname: 'api.example.com' });

            expect(successListener).toHaveBeenCalledTimes(1);
            expect(successListener).toHaveBeenCalledWith({ url: 'https://api.example.com/one', hostname: 'api.example.com', status: 200 });

            expect(errorListener).toHaveBeenCalledTimes(1);
            expect(errorListener).toHaveBeenCalledWith(expect.objectContaining({
                url: 'https://api.example.com/two',
                hostname: 'api.example.com',
            }));
            expect(errorListener.mock.calls[0][0].error.message).toBe('Failed');

            expect(completeListener).toHaveBeenCalledWith({ successful: 1, failed: 1 });
        });

        it('should forward p-queue events with hostname prefix', (done) => {
            const rl = new RequestLimited({ queueDefaults: { concurrency: 1 } });
            const addListener = jest.fn();
            const activeListener = jest.fn();

            rl.on('host.com:add', addListener);
            rl.on('host.com:active', activeListener);
            rl.on('host.com:idle', () => {
                // This event fires when the queue is empty and all tasks have completed.
                expect(addListener).toHaveBeenCalledTimes(1);
                expect(activeListener).toHaveBeenCalledTimes(1);
                done(); // Signal that the async test is complete
            });

            // Mock ky to resolve after a short delay to allow events to fire
            mockKy.mockImplementation(() => new Promise(resolve =>
                setTimeout(() => resolve(createMockKyResponse({})), 10)
            ));

            rl.fetchAll([{ url: 'https://host.com/1' }]);
        });
    });

    describe('Queue Control', () => {
        it('should stop and resume all queues', async () => {
            const rl = new RequestLimited({ queueDefaults: { concurrency: 1 } });
            const stoppedListener = jest.fn();
            const resumedListener = jest.fn();
            const allStoppedListener = jest.fn();
            const allResumedListener = jest.fn();

            rl.on('api.example.com:stopped', stoppedListener);
            rl.on('api.example.com:resumed', resumedListener);
            rl.on('allQueuesStopped', allStoppedListener);
            rl.on('allQueuesResumed', allResumedListener);

            // Add a task to create the queue
            mockKy.mockResolvedValue(createMockKyResponse({}));
            // Don't await this, we want to control the queue before it finishes
            rl.fetchAll([{ url: 'https://api.example.com/1' }]);

            // Wait for the queue to be created and the task to be added
            await new Promise(resolve => process.nextTick(resolve));

            const queue = rl._getOrCreateQueue('api.example.com');

            rl.stopAllQueues();
            expect(queue.isPaused).toBe(true);
            expect(queue.size).toBe(0); // `clear` should have been called
            expect(stoppedListener).toHaveBeenCalledTimes(1);
            expect(allStoppedListener).toHaveBeenCalledTimes(1);

            rl.resumeAllQueues();
            expect(queue.isPaused).toBe(false);
            expect(resumedListener).toHaveBeenCalledTimes(1);
            expect(allResumedListener).toHaveBeenCalledTimes(1);
        });
    });
});

