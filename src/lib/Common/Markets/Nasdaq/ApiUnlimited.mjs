import RequestUnlimited from '../../Retrieve/RequestUnlimited.mjs';

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

export class ApiUnlimited {

    static async endPoint(url, retry = null) {

        return RequestUnlimited.endPoint(url, getHeaders(url), retry);

    } // endPoint

} // ApiUnlimited

// const res = await ApiUnlimited.endPoint('https://api.nasdaq.com/api/market-info');
// console.log(res.status, res);
// let a = 5;