// src/index.mjs
import * as Common from './lib/Common/index.mjs';
import * as Cloud from './lib/Cloud/index.mjs';

global.WebLib = {};
if (!global.logger) {
    const { default: Logger } = await import('./lib/Common/Logger/Logger.mjs');
    global.logger = new Logger();
}

const WebLib = {
    Common,
    Cloud,
};

export default WebLib;
