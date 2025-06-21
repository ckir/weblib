
export { ky } from 'ky';
export { serializeError, deserializeError } from 'serialize-error';
export { safeStringify } from 'safe-stringify';
export * as luxon from 'luxon';

import * as Common from './lib/Common/index.mjs';
import * as Cloud from './lib/Cloud/index.mjs';

global.WebLib = {};
if (!global.logger) {
    const { default: Logger } = await import('./lib/Common/Logger/LoggerDummy.mjs');
    global.logger = new Logger();
}

export const WebLib = {
    Common,
    Cloud,
};

export default WebLib;
