
import ky from 'ky';
import { serializeError, deserializeError } from 'serialize-error';
import safeStringify from 'safe-stringify';
import * as luxon from 'luxon';

// import * as Common from './lib/Common/index.mjs';
// import * as Cloud from './lib/Cloud/index.mjs';

globalThis.WebLib = {};
if (!globalThis.logger) {
    const { default: Logger } = await import('./lib/Common/Loggers/LoggerDummy.mjs');
    globalThis.logger = new Logger();
}

const Common = await import('./lib/Common/index.mjs');
const Cloud = await import('./lib/Cloud/index.mjs');

export const WebLib = {
    Common,
    Cloud,
    Vendored: {
        ky,
        serializeError,
        deserializeError,
        safeStringify,
        luxon
    }
};

export default WebLib;
