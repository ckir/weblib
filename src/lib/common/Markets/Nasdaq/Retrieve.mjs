// Define header configurations at the module level for clarity and reusability

const COMMON_HEADERS = {
    "accept-language": "en-US,en;q=0.9,el-GR;q=0.8,el;q=0.7",
    "cache-control": "no-cache",
    "pragma": "no-cache",
    "priority": "u=1, i",
    "sec-ch-ua": "\"Google Chrome\";v=\"135\", \"Not-A.Brand\";v=\"8\", \"Chromium\";v=\"135\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
};

const CHARTING_FETCH_OPTIONS = {
    method: "GET",
    headers: {
        ...COMMON_HEADERS,
        "accept": "*/*",
        "sec-fetch-site": "same-origin",
        "Referer": "https://charting.nasdaq.com/dynamic/chart.html",
        "Referrer-Policy": "strict-origin-when-cross-origin"
    },
    body: null, // Explicitly null for GET, as in original
};

const DEFAULT_NASDAQ_FETCH_OPTIONS = {
    method: "GET",
    headers: {
        ...COMMON_HEADERS,
        'accept': 'application/json, text/plain, */*',
        'dnt': '1',
        'origin': 'https://www.nasdaq.com',
        'referer': 'https://www.nasdaq.com/',
        'sec-fetch-site': 'same-site',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'
    },
    // body: null can be omitted for GET
};

export class Retrieve {

    static apiFetch = async (url, { maxRetries = 3, initialDelayMs = 1000, timeoutMs = 15000 } = {}) => {
        let lastError;

        const getFetchOptions = (currentUrl) => {
            if (currentUrl.includes('charting')) {
                return CHARTING_FETCH_OPTIONS;
            }
            return DEFAULT_NASDAQ_FETCH_OPTIONS;
        };

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                controller.abort();
            }, timeoutMs);

            const fetchOptions = getFetchOptions(url);

            try {
                console.log(`[INFO] Fetching ${url} (Attempt ${attempt}/${maxRetries}, Timeout: ${timeoutMs}ms)`);
                const response = await fetch(url, {
                    ...fetchOptions,
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (response.ok) {
                    console.log(`[INFO] Successfully fetched ${url} (Status: ${response.status}) on attempt ${attempt}`);
                    return response;
                }

                // Handle non-OK responses
                console.warn(`[WARN] Fetch attempt ${attempt} for ${url} failed with status: ${response.status} ${response.statusText}`);
                lastError = new Error(`HTTP error ${response.status}: ${response.statusText}`);

                // Retry only for server errors (5xx)
                if (response.status >= 500 && response.status <= 599) {
                    if (attempt < maxRetries) {
                        const delay = initialDelayMs * Math.pow(2, attempt - 1); // Exponential backoff
                        console.log(`[INFO] Server error ${response.status}. Retrying in ${delay}ms...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        continue; // Next attempt
                    } else {
                        console.error(`[ERROR] All ${maxRetries} retries failed for ${url}. Last status: ${response.status}`);
                        return response; // Return the last failed response for the caller to inspect
                    }
                } else {
                    // For 4xx errors or other non-retryable status codes, don't retry.
                    console.warn(`[WARN] Non-retryable status ${response.status} for ${url}. Not retrying.`);
                    return response; // Return the response for the caller to handle.
                }

            } catch (error) {
                clearTimeout(timeoutId);
                lastError = error;

                if (error.name === 'AbortError') {
                    console.warn(`[WARN] Request to ${url} timed out (Attempt ${attempt}/${maxRetries})`);
                } else {
                    console.warn(`[WARN] Fetch attempt ${attempt} for ${url} failed: ${error.message}`);
                }

                if (attempt < maxRetries) {
                    const delay = initialDelayMs * Math.pow(2, attempt - 1);
                    console.log(`[INFO] Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    console.error(`[ERROR] All ${maxRetries} retries failed for ${url}. Last error: ${lastError.message}`);
                    throw lastError; // After all retries, throw the last encountered error
                }
            }
        }
        // Fallback, should ideally not be reached if maxRetries > 0 and loop logic is correct
        if (lastError) throw lastError;
        throw new Error(`Failed to fetch ${url} after ${maxRetries} attempts (unknown state).`);
    } // apiFetch

    static apiErrorToString = (status) => {
        // Ensure status and bCodeMessage are valid before processing
        if (!status || typeof status.rCode === 'undefined') {
            return "Invalid status object for error formatting.";
        }
        let messages = [`rCode: ${status.rCode} `];
        if (Array.isArray(status.bCodeMessage)) {
            status.bCodeMessage.forEach(element => {
                messages.push(` code: ${element.code} = ${element.errorMessage}`);
            });
        } else {
            messages.push("bCodeMessage is missing or not an array.");
        }
        return messages.join('::');
    } // apiErrorToString

    static async endpoint(url) {
        console.log(`[INFO] Processing endpoint for URL: ${url}`);
        let response;

        try {
            // You can customize retry/timeout options per call if needed:
            // response = await Retrieve.apiFetch(url, { maxRetries: 5, timeoutMs: 30000 });
            response = await Retrieve.apiFetch(url);
        } catch (error) {
            // This catches errors thrown by apiFetch (e.g., network errors after all retries, final timeout)
            console.error(`[ERROR] Critical failure fetching ${url}: ${error.message}`);
            return {
                url: url,
                status: 0, // Indicate a client-side fetch/network failure
                statusText: `Fetch error: ${error.message}`,
                headers: {},
                body: `Failed to retrieve data: ${error.message}`
            };
        }

        // Convert headers to an object
        const headers = Object.fromEntries(response.headers.entries());

        // Read response body as text first to avoid "Body has already been used" error
        let responseText;

        try {
            console.log(`[DEBUG] Before response.text() for ${url}. response.bodyUsed: ${response.bodyUsed}, response.body: ${!!response.body}`);
            responseText = await response.text();
            console.log(`[DEBUG] After response.text() for ${url}. response.bodyUsed: ${response.bodyUsed}`);
        } catch (textError) {
            console.error(`[ERROR] Failed to read response text for ${url} (Status: ${response.status}): ${textError.message}`);
            return {
                url: response.url || url,
                status: response.status || 0,
                statusText: response.statusText || `Error reading response body`,
                headers: headers,
                body: `Error reading response body: ${textError.message}`
            };
        }

        // If apiFetch returned a non-OK response (e.g., 404, or 5xx after exhausting retries)
        if (!response.ok) {
            console.warn(`[WARN] Received non-OK response for ${url}: ${response.status} ${response.statusText}.`);
            // Log a snippet of the body for debugging non-OK responses
            // console.debug(`[DEBUG] Non-OK response body for ${url}: ${responseText.substring(0, 200)}...`);
            return {
                url: response.url,
                status: response.status,
                statusText: response.statusText,
                headers: headers,
                body: responseText // Return the raw error body from the server
            };
        }

        let body;
        try {
            // Attempt to parse the text as JSON
            body = JSON.parse(responseText);
            console.log(`[INFO] Successfully parsed JSON response for ${url}`);
        } catch (parseError) {
            console.warn(`[WARN] Failed to parse JSON for ${url}: ${parseError.message}. Body was: ${responseText.substring(0,200)}...`);
            return {
                url: response.url,
                status: response.status, // Should be OK here, but good to keep
                statusText: response.statusText,
                headers: headers,
                body: responseText // Return raw text as per original logic
            };
        }

        try {
            const newYorkTimeZone = "America/New_York";
            // Corrected typo: toLocaleString
            const nowInNewYorkStr = new Date().toLocaleString("en-US", { timeZone: newYorkTimeZone });
            const newYorkDate = new Date(nowInNewYorkStr); // This parses the NY local time string
            const isoTimestamp = newYorkDate.toISOString(); // Converts to UTC ISO string

            if (url.includes('charting')) {
                if (typeof body === 'object' && body !== null) {
                    body.ts = isoTimestamp;
                } else {
                    console.warn(`[WARN] Body for charting URL ${url} is not an object. Creating new object for timestamp. Original body type: ${typeof body}`);
                    body = { originalBody: body, ts: isoTimestamp };
                }
            } else {
                if (typeof body === 'object' && body !== null) {
                    if (typeof body.data !== 'object' || body.data === null) {
                        // console.warn(`[WARN] body.data is not an object for URL ${url}. Initializing body.data.`);
                        body.data = {}; // Initialize if not present or not an object
                    }
                    body.data.ts = isoTimestamp;
                } else {
                    console.warn(`[WARN] Body for non-charting URL ${url} is not an object. Creating new object for timestamp. Original body type: ${typeof body}`);
                    body = { originalBody: body, data: { ts: isoTimestamp } };
                }
            }
            console.log(`[INFO] Timestamp added for ${url}`);
        } catch (tsError) {
            console.error(`[ERROR] Failed to add timestamp for ${url}: ${tsError.message}. Body remains un-timestamped.`);
            // Continue with the body without timestamp if this fails
        }

        return {
            url: response.url,
            status: response.status,
            statusText: response.statusText,
            headers: headers,
            body: body
        };
    } // endpoint (formerly apiNasdaqFetch)

} // Retrieve