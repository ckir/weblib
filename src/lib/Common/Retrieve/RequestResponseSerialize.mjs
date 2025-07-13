export default class RequestResponseSerialize {

    static async serialize(response) {
        if (!response) {
            return null;
        }

        // Clone the response before reading the body. This is crucial because the body
        // is a stream and can only be read once. Cloning ensures that if the original
        // response object is used elsewhere, its body is still available.
        const clonedResponse = response.clone();

        const headers = {};
        clonedResponse.headers.forEach((value, key) => {
            headers[key] = value;
        });
        // A more concise way to get headers as an object:
        // const headers = Object.fromEntries(clonedResponse.headers.entries());

        let body;
        try {
            const contentType = clonedResponse.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                body = await clonedResponse.json();
            } else if (contentType && (contentType.includes('text/') || contentType.includes('application/xml') || contentType.includes('application/javascript'))) {
                body = await clonedResponse.text();
            } else {
                // For binary data (e.g., images, application/octet-stream),
                // you might want to read as ArrayBuffer and convert to Base64,
                // or simply indicate the content type and that it's not text/JSON.
                // For this example, we'll just note it.
                body = await clonedResponse.text().catch(() => "[Could not read body as text]");
                // const bodyText = await clonedResponse.text().catch(() => "[Could not read body as text]");
                // body = `[Content-Type: ${contentType || 'N/A'} - Body preview: ${bodyText.substring(0, 100)}${bodyText.length > 100 ? '...' : ''}]`;
                // If you expect binary data and need to serialize it, consider:
                // const buffer = await clonedResponse.arrayBuffer();
                // body = Buffer.from(buffer).toString('base64'); // Example for Node.js Buffer
            }
        } catch (error) {
           global.logger.warn('Error parsing response body during serialization:', error);
            // Try to get text if JSON parsing failed or if it was an unexpected error
            try {
                body = await clonedResponse.text(); // Attempt to read as text as a last resort
            } catch (textError) {
                global.logger.warn('Error reading response body as text during serialization fallback:', textError);
                body = '[Error reading or parsing body]';
            }
        }

        return {
            ok: clonedResponse.ok,
            status: clonedResponse.status,
            statusText: clonedResponse.statusText,
            headers: headers,
            url: clonedResponse.url,
            redirected: clonedResponse.redirected,
            type: clonedResponse.type,
            body: body,
        };
    }

} // RequestResponseSerialize