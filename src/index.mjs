
import ky from 'ky';
import { serializeError, deserializeError } from 'serialize-error';
import safeStringify from 'safe-stringify';
import * as luxon from 'luxon';

import ConfigCloud from './lib/Common/Configs/ConfigCloud.mjs';

globalThis.WebLib = {};

if (!globalThis.logger) {
    const { default: Logger } = await import('./lib/Common/Loggers/LoggerDummy.mjs');
    globalThis.logger = new Logger();
    globalThis.logger.debug('Logger initialized.');
}

if (!globalThis.cloudConfig) {
    globalThis.cloudConfig = await ConfigCloud.getCloudConfig();
    globalThis.logger.info('WebLib: Cloud config loaded.');
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

export function init() {
    globalThis.logger.info('WebLib initialized');
}

export default WebLib;
