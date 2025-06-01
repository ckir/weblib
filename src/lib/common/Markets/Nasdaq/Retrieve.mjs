export class Retrieve {

    static apiFetch = async (url) => {
        let apiHeaders;
        if (url.includes('charting')) {
            apiHeaders = {
                headers: {
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
                },
                "body": null,
                "method": "GET"
            }
        } else {
            apiHeaders = {
                headers: {
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
        }
        return await fetch(url, apiHeaders)
    } // apiFetch

    static apiErrorToString = (status) => {
        let messages = [`rCode: ${status.rCode} `];
        status.bCodeMessage.forEach(element => {
            messages.push(` code: ${element.code} = ${element.errorMessage}`);
        });
        return messages.join('::');
    } // apiErrorToString

    static async endpoint(url) {
        const response = await Retrieve.apiFetch(url);

        // Convert headers to an object
        const headers = Object.fromEntries(response.headers.entries());

        // Read response body as text or JSON
        let body;
        try {
            body = await response.json();
        } catch (error) {
            body = await response.text();
            return {
                url: response.url,
                status: response.status,
                statusText: response.statusText,
                headers: headers,
                body: body
            };
        }

        // Get the current date in New York time zone
        const newYorkTimeZone = "America/New_York";
        const nowInNewYork = new Date().toLocaleString("en-US", { timeZone: newYorkTimeZone });
        const newYorkDate = new Date(nowInNewYork);
        if (url.includes('charting')) {
            body.ts = newYorkDate.toISOString();
        } else {
            body.data.ts = newYorkDate.toISOString();
        }

        return {
            url: response.url,
            status: response.status,
            statusText: response.statusText,
            headers: headers,
            body: body
        };
    } // apiNasdaqFetch

} // Retrieve