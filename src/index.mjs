// src/index.js
import * as Common from './lib/common/index.mjs';
import * as Cloudflare from './lib/cloudflare/index.mjs';
import * as CloudRun from './lib/cloudrun/index.mjs';
import * as Lambda from './lib/lambda/index.mjs';

const WebLib = {
    Common,
    Cloudflare,
    CloudRun,
    Lambda,
};

export default WebLib;
