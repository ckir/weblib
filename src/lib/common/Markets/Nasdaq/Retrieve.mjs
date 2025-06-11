import ky from 'ky';
import { serializeError } from 'serialize-error';

function getHeaders(url) {
    if (url.includes('charting')) {
        return {
            "accept": "*/*",
            "accept-language": "en-US,en;q=0.9,el-GR;q=0.8,el;q=0.7",
            "cache-control": "no-cache",
            "pragma": "no-cache",
            "priority": "u=1, i",
            "sec-ch-ua": "\"Google Chrome\";v=\"135\", \"Not-A.Brand\";v=\"8\", \"Chromium\";v=\"135\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "Referer": "https://charting.nasdaq.com/dynamic/chart.html",
            "Referrer-Policy": "strict-origin-when-cross-origin"
        }
    } else {
        return {
            'accept': 'application/json, text/plain, */*',
            'accept-language': 'en-US,en;q=0.9,el-GR;q=0.8,el;q=0.7',
            'cache-control': 'no-cache',
            'dnt': '1',
            'origin': 'https://www.nasdaq.com',
            'pragma': 'no-cache',
            'priority': 'u=1, i',
            'referer': 'https://www.nasdaq.com/',
            'sec-ch-ua': '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-site',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'
        }
    }
} // getHeaders

async function serializeResponse(response) {
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
            const bodyText = await clonedResponse.text().catch(() => "[Could not read body as text]");
            body = `[Content-Type: ${contentType || 'N/A'} - Body preview: ${bodyText.substring(0, 100)}${bodyText.length > 100 ? '...' : ''}]`;
            // If you expect binary data and need to serialize it, consider:
            // const buffer = await clonedResponse.arrayBuffer();
            // body = Buffer.from(buffer).toString('base64'); // Example for Node.js Buffer
        }
    } catch (error) {
        console.error('Error parsing response body during serialization:', error);
        // Try to get text if JSON parsing failed or if it was an unexpected error
        try {
            body = await clonedResponse.text(); // Attempt to read as text as a last resort
        } catch (textError) {
            console.error('Error reading response body as text during serialization fallback:', textError);
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
} //

export class Retrieve {

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

    static async endPoint(url, retry = null) {

        let request;
        // let response;

        try {
            request = ky.create({
                headers: getHeaders(url),
                retry: retry || this.defaults.retry,
                hooks: this.defaults.hooks
            });

            const responseObject = await request(url);
            const response = await serializeResponse(responseObject);
            return response;
        } catch (error) {
            const serializedError = serializeError(error);
            return serializedError;
        }
    }

} // Retrieve

// const res = await Retrieve.endPoint('https://api.nasdaq.com/api/market-info');
// console.log(res.status, res);
// let a = 5;