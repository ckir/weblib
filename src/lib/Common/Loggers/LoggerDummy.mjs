import packageJson from '../../../../package.json' with { type: 'json' };

const packageName = packageJson.name;

export default class LoggerDummy {

    defaults = {}

    constructor(options = {}) {
        this.options = { ...this.defaults, ...options }
    }

    silly(...args) { console.log(new Date().toISOString(), `SILLY: ${packageName}: `, ...args); }
    trace(...args) { console.log(new Date().toISOString(), `TRACE: ${packageName}: `, ...args); }
    debug(...args) { console.log(new Date().toISOString(), `DEBUG: ${packageName}: `, ...args); }
    info(...args) { console.log(new Date().toISOString(), `INFO: ${packageName}: `, ...args); }
    warn(...args) { console.log(new Date().toISOString(), `WARN: ${packageName}: `, ...args); }
    error(...args) { console.log(new Date().toISOString(), `ERROR: ${packageName}: `, ...args); }
    fatal(...args) { console.log(new Date().toISOString(), `FATAL: ${packageName}: `, ...args); }

} // LoggerDummy