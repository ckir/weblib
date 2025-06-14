
export default class Logger {
    silly(...args) { console.log(new Date().toISOString(), "SILLY:", ...args); }
    trace(...args) { console.log(new Date().toISOString(), "TRACE:", ...args); }
    debug(...args) { console.log(new Date().toISOString(), "DEBUG:", ...args); }
    info(...args) { console.log(new Date().toISOString(), "INFO:", ...args); }
    warn(...args) { console.log(new Date().toISOString(), "WARN:", ...args); }
    error(...args) { console.log(new Date().toISOString(), "ERROR:", ...args); }
    fatal(...args) { console.log(new Date().toISOString(), "FATAL:", ...args); }
}