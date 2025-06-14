// src/index.mjs
import * as Common from './lib/common/index.mjs';
import * as Cloudflare from './lib/cloudflare/index.mjs';
import * as CloudRun from './lib/cloudrun/index.mjs';
import * as Lambda from './lib/lambda/index.mjs';
import Logger from './lib/common/Logger/Logger.mjs';

global.WebLib = {};
if (!global.logger) {
    const { default: Logger } = await import('./lib/common/Logger/Logger.mjs');
    global.logger = new Logger();
}

const WebLib = {
    Common,
    Cloudflare,
    CloudRun,
    Lambda,
    Logger
};

export default WebLib;
