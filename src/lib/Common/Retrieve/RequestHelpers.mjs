import LoggerDummy from '../../Logger/LoggerDummy.mjs';

if (typeof global.logger === 'undefined') {
    global.logger = new LoggerDummy();
}

export default class RequestSerializer {
    /**
     * Serializes a Request object into a plain JavaScript object.
     * This object can then be stringified (e.g., with JSON.stringify).
     *
     * @param {Request} request - The Request object to serialize.
     * @returns {Promise<object>} A promise that resolves with the serializable object.
     */
    static async serialize(request) {
        if (!(request instanceof Request)) {
            throw new Error('Input must be a Request object.');
        }

        const serializedRequest = {
            url: request.url,
            method: request.method,
            headers: {},
            body: null,
            redirect: request.redirect,
            referrer: request.referrer,
            referrerPolicy: request.referrerPolicy,
            mode: request.mode,
            credentials: request.credentials,
            cache: request.cache,
            integrity: request.integrity,
            keepalive: request.keepalive,
            signal: null // We don't serialize AbortSignal directly as it's not transferable/reconstructible in this way
        };

        // Serialize headers
        for (const [name, value] of request.headers.entries()) {
            serializedRequest.headers[name] = value;
        }

        // Serialize body if present
        if (request.bodyUsed) {
            // If body has already been used, we cannot read it again.
            // In a real application, you might want to clone the request before using its body
            // or handle this scenario based on your application's logic.
            global.logger.warn('Request body has already been used. Body will not be serialized.');
        } else if (request.method !== 'GET' && request.method !== 'HEAD') {
            try {
                // Attempt to read body as text. Adjust based on expected content type (e.g., blob, arrayBuffer, formData)
                const textBody = await request.clone().text(); // Clone to avoid bodyUsed issue on original request
                serializedRequest.body = textBody;
                // You might also want to store content-type to help deserialize
                serializedRequest.bodyType = 'text'; // Or 'json', 'blob', 'arrayBuffer', 'formData'
            } catch (error) {
                global.logger.error('Error reading request body:', error);
                serializedRequest.body = null;
            }
        }

        return serializedRequest;
    }

    /**
     * Deserializes a plain JavaScript object back into a Request object.
     *
     * @param {object} serializedRequest - The object containing serialized request data.
     * @returns {Request} The reconstructed Request object.
     */
    static deserialize(serializedRequest) {
        if (typeof serializedRequest !== 'object' || serializedRequest === null) {
            throw new Error('Input must be a valid serialized request object.');
        }

        const { url, method, headers, body, bodyType, ...options } = serializedRequest;

        if (!url || typeof url !== 'string') {
            throw new Error('Serialized request must contain a valid "url" property.');
        }

        const requestOptions = {
            method: method,
            headers: new Headers(headers),
            redirect: options.redirect,
            referrer: options.referrer,
            referrerPolicy: options.referrerPolicy,
            mode: options.mode,
            credentials: options.credentials,
            cache: options.cache,
            integrity: options.integrity,
            keepalive: options.keepalive,
            // signal cannot be directly reconstructed from the serialized state
        };

        // Reconstruct body
        if (body !== null) {
            switch (bodyType) {
                case 'text':
                    requestOptions.body = body;
                    break;
                // Add cases for other body types if you serialize them
                case 'json':
                    requestOptions.body = JSON.stringify(body);
                    requestOptions.headers.set('Content-Type', 'application/json');
                    break;
                // case 'arrayBuffer':
                //     requestOptions.body = new Uint8Array(body).buffer;
                //     break;
                // case 'blob':
                //     // This is more complex as Blob constructor might need type and size
                //     // For simple cases, you might store blob as a base64 string
                //     break;
                default:
                    requestOptions.body = body; // Fallback for unknown or default body types
            }
        }

        return new Request(url, requestOptions);
    }

} // RequestSerializer

// --- Example Usage ---

// async function main() {
//     // 1. Create a Request object
//     const originalRequest = new Request('https://api.example.com/data', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//             'X-Custom-Header': 'Hello'
//         },
//         body: JSON.stringify({ name: 'Alice', age: 30 }),
//         cache: 'no-cache',
//         mode: 'cors'
//     });

//     console.log('Original Request URL:', originalRequest.url);
//     console.log('Original Request Method:', originalRequest.method);
//     console.log('Original Request Headers:', Object.fromEntries(originalRequest.headers.entries()));

//     // 2. Serialize the Request
//     const serializedData = await RequestSerializer.serialize(originalRequest);
//     console.log('\nSerialized Data:', JSON.stringify(serializedData, null, 2));

//     // You can now send `JSON.stringify(serializedData)` over a network,
//     // save it to a file, etc.

//     // 3. Deserialize the data back into a Request object
//     const reconstructedRequest = RequestSerializer.deserialize(serializedData);

//     console.log('\nReconstructed Request URL:', reconstructedRequest.url);
//     console.log('Reconstructed Request Method:', reconstructedRequest.method);
//     console.log('Reconstructed Request Headers:', Object.fromEntries(reconstructedRequest.headers.entries()));

//     // Verify body (needs to be read as well)
//     if (reconstructedRequest.method !== 'GET' && reconstructedRequest.method !== 'HEAD') {
//         const reconstructedBody = await reconstructedRequest.text();
//         console.log('Reconstructed Request Body:', reconstructedBody);
//         console.log('Body Matches Original:', reconstructedBody === JSON.stringify({ name: 'Alice', age: 30 }));
//     }

//     // Example with a GET request (no body)
//     const getRequest = new Request('https://jsonplaceholder.typicode.com/todos/1');
//     const serializedGet = await RequestSerializer.serialize(getRequest);
//     const reconstructedGet = RequestSerializer.deserialize(serializedGet);
//     console.log('\nReconstructed GET Request URL:', reconstructedGet.url);
//     console.log('Reconstructed GET Request Body (should be null):', await reconstructedGet.text()); // Should be empty string if no body
// }

// main().catch(console.error);