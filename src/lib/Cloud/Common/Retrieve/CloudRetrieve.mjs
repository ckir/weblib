
import RequestUnlimited from '../../../Common/Retrieve/RequestUnlimited.mjs';
import ArrayUtils from '../../../Common/Utils/Misc/ArrayUtils.mjs';

if (!globalThis.logger) {
    const { default: Logger } = await import('../../../Common/Loggers/LoggerDummy.mjs');
    globalThis.logger = new Logger();
}

if (!globalThis.cloudConfig) {
    const { default: ConfigCloud } = await import('../../../Common/Configs/ConfigCloud.mjs');
    globalThis.cloudConfig = await ConfigCloud.getCloudConfig();
    globalThis.logger.debug('Cloud config initialized.');
}

const APIENDPOINT = '/api/proxies/http';

export default class CloudRetrieve {

    /**
     * Makes an HTTP request to a single URL through all available cloud functions.
     * It will try all available cloud functions until it gets a successful response or all cloud functions have been tried.
     * It handles response serialization and error handling, always resolving the promise.
     *
     * @static
     * @async
     * @param {string} fetchUrl - The URL to fetch through the cloud functions.
     * @param {object} [options={}] - Optional options for the request, mirroring `ky` options.
     * @returns {Promise<Object>} A promise that resolves to the serialized response object or a serialized error object.
     */
    static async endPoint(fetchUrl, options = {}) {
        const cloudFetchers = cloudConfig.commonAll.cloudFetchers;
        const allUrls = ArrayUtils.arrayShuffle(Object.values(cloudFetchers).flat());
        for (let cloudFunction of allUrls) {
            {
                globalThis.logger.silly(`Trying cloud function ${cloudFunction}`);
                const result = await RequestUnlimited.endPoint(`${cloudFunction}${APIENDPOINT}?url=${fetchUrl}`, options);
                if (result.status === 'success') {
                    globalThis.logger.silly(`Cloud function ${cloudFunction} succeeded.`);
                    return result;
                }
            }
        }
        globalThis.logger.silly(`All cloud functions failed for ${fetchUrl}.`);
        return { status: 'error', reason: result };

    } // endPoint

} // CloudRetrieve

// const a = await CloudRetrieve.endPoint('https://jsonplaceholder.typicode.com/posts/1');
// console.log(a);