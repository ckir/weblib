import styles from 'ansi-styles';
import PQueue from 'p-queue';
import { serializeError } from 'serialize-error';
import safeStringify from 'safe-stringify';

import { DateTimeUtils } from "../Utils/Misc/DateTimeUtils.mjs";

const LogMap = [];

export default class LoggerCloud {

    LoggerDefaults = {
        useTTY: [6, 5, 4, 3, 2, 1, 0],
        useMap: [6, 5, 4, 3, 2, 1, 0],
    }

    constructor(appName, options = {}) {

        this.appName = appName
        this.options = { ...this.LoggerDefaults, ...options }
        this.queue = new PQueue({ concurrency: 1, autoStart: true })

    }

    ts() {
        return DateTimeUtils.tstzString(true)
    }

    getLogMap() {
        return LogMap;
    }

    // eslint-disable-next-line no-unused-vars
    async log(log_level, log_message, log_extras = {}, options = null) {

        const logLevelNames = ['SILLY', 'TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];

        let ts = styles.color.gray.open + this.ts() + styles.color.gray.close
        let colored_appName = styles.color.gray.open + '[' + this.appName + ']' + styles.color.gray.close
        let colored_message


        if (this.options.useTTY.includes(log_level)) {
            switch (log_level) {
                case 6: // fatal
                    colored_message = styles.bgColor.bgRedBright.open + styles.color.whiteBright.open + log_message + styles.color.whiteBright.close + styles.bgColor.bgRedBright.close
                    break
                case 5: // error
                    colored_message = styles.color.redBright.open + log_message + styles.color.redBright.close
                    break
                case 4: // warn
                    colored_message = styles.color.yellowBright.open + log_message + styles.color.yellowBright.close
                    break
                case 3: // info
                    colored_message = styles.color.greenBright.open + log_message + styles.color.greenBright.close
                    break
                case 2: // debug
                    colored_message = styles.color.whiteBright.open + log_message + styles.color.whiteBright.close
                    break
                case 1: // trace
                    colored_message = styles.color.cyanBright.open + log_message + styles.color.cyanBright.close
                    break
                default: // silly
                    colored_message = styles.color.blue.open + log_message + styles.color.blue.close
                    break
            }

            console.log(`${ts}${colored_appName}\n${colored_message}`)
            if (Object.keys(log_extras).length > 0) console.log(`${ts}${colored_appName} ${styles.color.gray.open + safeStringify(log_extras) + styles.color.gray.close}`)
        }

        if (this.options.useMap.includes(log_level)) {
            const logKey = `${DateTimeUtils.tstzString()}:${this.appName}:`;
            const logEntry = {
                level: logLevelNames[log_level],
                message: log_message,
                extras: (log_extras instanceof Error) ? serializeError(log_extras) : log_extras,
            };
            LogMap.push({ key: logKey, value: logEntry });
        }

    } // log

    async silly(log_message, log_extras = {}, options = null) {
        const level = 0
        await this.log(level, log_message, log_extras, options)
    }

    async trace(log_message, log_extras = {}, options = null) {
        const level = 1
        await this.log(level, log_message, log_extras, options)
    }

    async debug(log_message, log_extras = {}, options = null) {
        const level = 2
        await this.log(level, log_message, log_extras, options)
    }

    async info(log_message, log_extras = {}, options = null) {
        const level = 3
        await this.log(level, log_message, log_extras, options)
    }

    async warn(log_message, log_extras = {}, options = null) {
        const level = 4
        await this.log(level, log_message, log_extras, options)
    }

    async error(log_message, log_extras = {}, options = null) {
        const level = 5
        await this.log(level, log_message, log_extras, options)
    }

    async fatal(log_message, log_extras = {}, options = null) {
        const level = 6
        await this.log(level, log_message, log_extras, options)
    }

} // LoggerCloud

// const L = new Logger("myapp")
// L.debug("Hello NASDAQ")
// const levels = [6, 5, 4, 3, 2, 1, 0]
// levels.forEach(element => {
//     L.log(element, "This is a message", { extras: "info" })
// })
