// src/index.js
import * as Common from './lib/common/index.js';
import * as Cloudflare from './lib/cloudflare/index.js';
import * as CloudRun from './lib/cloudrun/index.js';
import * as Lambda from './lib/lambda/index.js';

const WebLib = {
    Common,
    Cloudflare,
    CloudRun,
    Lambda,
};

export default WebLib;
