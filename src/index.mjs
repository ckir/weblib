
import ky from 'ky';
export { ky };
import { serializeError, deserializeError } from 'serialize-error';
export { serializeError, deserializeError };
import safeStringify from 'safe-stringify';
export { safeStringify };
import * as luxon from 'luxon';
export { luxon };

import * as Common from './lib/Common/index.mjs';
import * as Cloud from './lib/Cloud/index.mjs';

globalThis.WebLib = {};
if (!globalThis.logger) {
    const { default: Logger } = await import('./lib/Common/Logger/LoggerDummy.mjs');
    globalThis.logger = new Logger();
}

export const WebLib = {
    Common,
    Cloud,
};

export default WebLib;
