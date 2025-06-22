import { execSync } from "node:child_process";
import styles from 'ansi-styles';
import PQueue from 'p-queue';
import safeStringify from 'safe-stringify';

import DateTimeUtils from "../Utils/Misc/DateTimeUtils.mjs";

const isWindows = process.platform === "win32";
const isLinux = process.platform === "linux";


export default class LoggerLocal {

    LoggerDefaults = {
        useTTY: [6, 5, 4, 3, 2, 1, 0],
        useVoice: { volume: 100, voice: (isLinux)? 'en+f2' : 5, levels: [6, 5, 4] },
        useFile: true,
    }

    constructor(appName, options = {}) {

        this.appName = appName
        this.options = { ...this.LoggerDefaults, ...options }
        this.queue = new PQueue({ concurrency: 1, autoStart: true})

    }

    ts() {
        return DateTimeUtils.tstzString(true)
        // const d = new Date()
        // return `${d.toISOString()}[${d.toTimeString().split(' ')[0] + '.' + (d.getMilliseconds() + '').padStart(3, '0')}]`
    }

    async log(log_level, log_message, log_extras = {}, options = null) {

        let ts = styles.color.gray.open + this.ts() + styles.color.gray.close
        let colored_appName = styles.color.gray.open + '[' + this.appName + ']' + styles.color.gray.close
        let colored_message

        if (this.options.useTTY) {

            if (!this.options.useTTY.includes(log_level)) return
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
        } // options.useTTY

        if (typeof options === 'object' && options !== null && Object.keys(options).length > 0) {
            const volume = Object.keys(options).includes('volume') ? options[volume] : this.options.useVoice.volume
            const voice = Object.keys(options).includes('voice') ? options[voice] : this.options.useVoice.voice
            await this.say(log_message, volume, voice)

        } else {
            if (this.options.useVoice && this.options.useVoice.levels.includes(log_level)) {
                this.say(log_message)
            }
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

    async say(log_message, volume = this.options.useVoice.volume, voice = this.options.useVoice.voice) {
        let ts = styles.color.gray.open + this.ts() + styles.color.gray.close
        let colored_appName = styles.color.gray.open + '[' + this.appName + ']' + styles.color.gray.close
        let colored_message

        await this.queue.add(async () => {
            const quote = (s) => {
                if (s && typeof s === 'object') {
                    return s.op.replace(/(.)/g, '\\$1')
                }
                if ((/["\s]/).test(s) && !(/'/).test(s)) {
                    return "'" + s.replace(/(['\\])/g, '\\$1') + "'"
                }
                if ((/["'\s]/).test(s)) {
                    return '"' + s.replace(/(["\\$`!])/g, '\\$1') + '"'
                }
                return String(s).replace(/([A-Za-z]:)?([#!"$&'()*,:<=>?@[\\\]^`{|}])/g, '$1\\$2')
            }
            try {
                const command = (isWindows)? `wsay -V ${volume} -v ${voice} "${log_message}"` : `espeak -a ${volume} -v ${voice} ${quote(log_message)}`
                execSync(command, { stdio: 'inherit' });
            }
            catch (error) {
                if (!error.stderr) error.stderr = ''
                colored_message = styles.color.redBright.open + `Error saying [${log_message}]: ${error.message} info: ${error.stderr.toString()}` + styles.color.redBright.close
                console.log(`${styles.color.gray.open + ts + styles.color.gray.close}${colored_appName} ${colored_message}`)
            }
        }, {priority: 1});

    } // say

} // LoggerLocal

// const L = new Logger("myapp")
// L.debug("Hello NASDAQ")
// const levels = [6, 5, 4, 3, 2, 1, 0]
// levels.forEach(element => {
//     L.log(element, "This is a message", { extras: "info" })
// })
