import RequestUnlimited from './RequestUnlimited.mjs';
import ky from 'ky';
import Response from './Response.mjs';
import { serializeError } from 'serialize-error';
import LoggerDummy from '../Loggers/LoggerDummy.mjs';

// Mock the dependencies using Jest
jest.mock('ky');
jest.mock('./Response.mjs');
jest.mock('serialize-error');

describe('RequestUnlimited', () => {
    // Before each test, we'll set up a mock logger and clear all previous mocks
    beforeEach(() => {
        jest.clearAllMocks();
        global.logger = new LoggerDummy();
        global.logger.warn = jest.fn();
        global.logger.error = jest.fn();
    });

    describe('endPoint', () => {
        it('should make a successful GET request by default and serialize the response', async () => {
            // Arrange: Set up mock return values for our dependencies
            const mockUrl = 'https://api.example.com/data';
            const mockResponseObject = { status: 200, data: 'some data' };
            const mockSerializedResponse = { statusCode: 200, body: { data: 'some data' } };

            const mockKyInstance = jest.fn().mockResolvedValue(mockResponseObject);
            ky.create.mockReturnValue(mockKyInstance);
            Response.serialize.mockResolvedValue(mockSerializedResponse);

            // Act: Call the method we are testing
            const result = await RequestUnlimited.endPoint(mockUrl);

            // Assert: Verify that our mocks were called correctly and the result is as expected
            expect(ky.create).toHaveBeenCalledWith(expect.objectContaining({
                retry: RequestUnlimited.defaults.retry
            }));
            expect(mockKyInstance).toHaveBeenCalledWith(mockUrl, { method: 'get' });
            expect(Response.serialize).toHaveBeenCalledWith(mockResponseObject);
            expect(result).toEqual(mockSerializedResponse);
        });

        it('should make a successful POST request with a body and headers', async () => {
            // Arrange
            const mockUrl = 'https://api.example.com/submit';
            const mockOptions = {
                method: 'post',
                json: { name: 'test' },
                headers: { 'X-Custom-Header': 'value' }
            };
            const mockResponseObject = { status: 201, data: 'created' };
            const mockSerializedResponse = { statusCode: 201, body: { data: 'created' } };

            const mockKyInstance = jest.fn().mockResolvedValue(mockResponseObject);
            ky.create.mockReturnValue(mockKyInstance);
            Response.serialize.mockResolvedValue(mockSerializedResponse);

            // Act
            const result = await RequestUnlimited.endPoint(mockUrl, mockOptions);

            // Assert
            expect(ky.create).toHaveBeenCalledWith(expect.objectContaining({
                headers: mockOptions.headers
            }));
            expect(mockKyInstance).toHaveBeenCalledWith(mockUrl, { method: 'post', json: mockOptions.json });
            expect(result).toEqual(mockSerializedResponse);
        });

        it('should handle a failed request, log a warning, and return a serialized error', async () => {
            // Arrange
            const mockUrl = 'https://api.example.com/notfound';
            const mockError = new Error('Not Found');
            mockError.response = { status: 404 };
            const mockSerializedError = { name: 'Error', message: 'Not Found', status: 404 };

            const mockKyInstance = jest.fn().mockRejectedValue(mockError);
            ky.create.mockReturnValue(mockKyInstance);
            serializeError.mockReturnValue(mockSerializedError);

            // Act
            const result = await RequestUnlimited.endPoint(mockUrl);

            // Assert
            expect(mockKyInstance).toHaveBeenCalledWith(mockUrl, { method: 'get' });
            expect(serializeError).toHaveBeenCalledWith(mockError);
            expect(global.logger.warn).toHaveBeenCalledWith('RequestUnlimited: Error occurred during API request:', mockError);
            expect(result).toEqual(mockSerializedError);
        });
    });

    describe('endPoints', () => {
        it('should make multiple parallel requests successfully', async () => {
            // Arrange
            const urls = ['https://api.example.com/1', 'https://api.example.com/2'];
            const mockResponse1 = { statusCode: 200, body: 'data 1' };
            const mockResponse2 = { statusCode: 200, body: 'data 2' };

            // We can spy on and mock our own method for this test
            jest.spyOn(RequestUnlimited, 'endPoint')
                .mockResolvedValueOnce(mockResponse1)
                .mockResolvedValueOnce(mockResponse2);

            // Act
            const results = await RequestUnlimited.endPoints(urls, { method: 'post' });

            // Assert
            expect(RequestUnlimited.endPoint).toHaveBeenCalledTimes(2);
            expect(RequestUnlimited.endPoint).toHaveBeenCalledWith(urls[0], { method: 'post' });
            expect(RequestUnlimited.endPoint).toHaveBeenCalledWith(urls[1], { method: 'post' });
            expect(results).toEqual([mockResponse1, mockResponse2]);
        });

        it('should handle a mix of successful and failed requests', async () => {
            // Arrange
            const urls = ['https://api.example.com/success', 'https://api.example.com/fail'];
            const mockSuccessResponse = { ok: true, statusCode: 200, body: 'data' };
            const mockErrorResponse = { name: 'HTTPError', message: 'Server Error' };

            // Spy on our own method to control its behavior for each call
            jest.spyOn(RequestUnlimited, 'endPoint')
                .mockResolvedValueOnce(mockSuccessResponse) // First call succeeds
                .mockResolvedValueOnce(mockErrorResponse);  // Second call fails

            // Act
            const results = await RequestUnlimited.endPoints(urls);

            // Assert
            expect(RequestUnlimited.endPoint).toHaveBeenCalledTimes(2);
            expect(RequestUnlimited.endPoint).toHaveBeenCalledWith(urls[0], {});
            expect(RequestUnlimited.endPoint).toHaveBeenCalledWith(urls[1], {});
            expect(results).toHaveLength(2);
            expect(results[0]).toEqual(mockSuccessResponse);
            expect(results[1]).toEqual(mockErrorResponse);
        });
    });
});