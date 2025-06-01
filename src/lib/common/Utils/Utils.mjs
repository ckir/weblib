import { DateTime } from "luxon"
import { Cron } from 'croner'

/**
 * Async function to find the parent folder name 
 * of the folder containing the 'package.json' file
 *
 * @returns {Promise<string>}
 * 
 */
export const getProjectRootFolder = async () => {

    const path = await import('node:path')
    const url = await import('node:url')
    const fs = await import('node:fs')
    const __filename = url.fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)

    let currentDir = __dirname;
    let packageJsonPath = '';
    const rootDir = path.parse(process.cwd()).root;

    while (currentDir !== rootDir) {
        const potentialPackageJsonPath = path.resolve(currentDir, 'package.json');

        if (fs.existsSync(potentialPackageJsonPath)) {
            packageJsonPath = potentialPackageJsonPath.split(path.sep).at(-2)
            return fs.realpathSync(path.join(packageJsonPath, '..'))
        } else {
            currentDir = path.resolve(currentDir, '..');
        }
    }

} // getProjectRootFolder

export class ConfigUtils {

    static isDebug() {
        if (process.env.DEBUG === 'true') {
            return true;
        }
        return false;
    } // isDebug

    static isProduction() {
        if (process.env.MODE === 'production') {
            return true;
        }
        return false;
    } // isProduction

    static isDevelopment() {
        if (process.env.MODE === 'development') {
            return true;
        }
        return false;
    } // isDevelopment

} // ConfigUtils

export class ArrayUtils {

    /**
    * Function to enclose array values
    * 
    * @param {array} array
    * @param {string} prefix default '['
    * @param {string} suffix default ']'
    * @returns {array}
    * 
    */
    static arrayValuesEnclose = (array, prefix = '[', suffix = ']') => {
        return array.map(title => prefix + title + suffix)
    }

    /**
     * Function to find the differences between two arrays
     *
     * @param {array} oldArray
     * @param {array} newArray
     * @returns {object}
     * 
     * new: Values that exists in newArray but do not exists in oldArray
     * removed: Values that exists in oldArray but do not exists in newArray
     * unchanged: Values common in oldArray and newArray
     * 
     */
    static arrayDiff = (oldArray, newArray) => {

        const changes = { 'new': [], 'removed': [], 'unchanged': [] }
        changes.new = newArray.filter(element => !oldArray.includes(element)).sort()
        changes.unchanged = newArray.filter(element => oldArray.includes(element)).sort()
        changes.removed = oldArray.filter(element => !newArray.includes(element)).sort()
        return changes

    } // arrayDiff

} // ArrayUtils

export class DateTimeUtils {

    /**
    * Method to get date time at different 
    * timezones ('UTC', 'America/New_York' and 'Europe/Athens')
    *
    * @param {number} timestamp default now()
    * @returns {object}
    * 
    */

    static tstz(timestamp = DateTime.utc().toMillis()) {

        // Format the date and time for UTC
        const utcDateTime = DateTime.fromMillis(timestamp, { zone: 'utc' })
        const utcDateTimeIsValid = utcDateTime.isValid
        const utcDateTimeString = (utcDateTimeIsValid) ? utcDateTime.toFormat("yyyy/MM/dd HH:mm:ss") : `Invalid`

        // Format the date and time for America/New_York
        const nyDateTime = utcDateTime.setZone('America/New_York')
        const nyDateIsValid = nyDateTime.isValid
        const nyDateTimeString = (nyDateIsValid) ? nyDateTime.toFormat("yyyy/MM/dd HH:mm:ss") : `Invalid`

        // Format the date and time for Europe/Athens
        const athensDateTime = utcDateTime.setZone('Europe/Athens')
        const athensDateTimeIsValid = athensDateTime.isValid
        const athensDateTimeString = (athensDateTimeIsValid) ? athensDateTime.toFormat("yyyy/MM/dd HH:mm:ss") : `Invalid`

        return {
            utc: { sql: utcDateTime.toSQL({ includeZone: true }), str: utcDateTimeString },
            newYork: { sql: nyDateTime.toSQL({ includeZone: true }), str: nyDateTimeString },
            athens: { sql: athensDateTime.toSQL({ includeZone: true }), str: athensDateTimeString },
        }

    } // tstz

    /**
    * Function to return datetime in
    * 'America/New_York', 'Europe/Athens'
    * and (optionally) 'UTC' timezones
    * 
    *
    * @param {boolean} utc
    * @param {number} timestamp default now()
    * @returns {string}
    * 
    */
    static tstzString(utc = false, timestamp = DateTime.utc().toMillis()) {
        const tstz = this.tstz(timestamp)
        return `N/Y:[${tstz.newYork.str}] Ath:[${tstz.athens.str}]` + ((utc) ? ` UTC: [${tstz.utc.str}]` : '')
    } // tstzString

    /**
    * Method to find the remaining milliseconds remainind
    * to a given time at a specified Timezone
    *
    * @param {string} time
    * @param {string} timezone
    * @returns {number}
    * 
    */

    static secondsToTimeAtTimezone(time = '23:59:59', timezone = 'America/New_York') {
        // Get the current date and time in the specific timezone
        const currentTime = DateTime.now().setZone(timezone)

        // Convert the provided specific time to a DateTime object in the same timezone
        const specificTime = DateTime.fromFormat(time, 'HH:mm:ss', { zone: timezone })

        // Calculate the difference in seconds between the current time and the specific time
        const remainingSeconds = specificTime.diff(currentTime).as('seconds')

        return Math.round(remainingSeconds)
    } // secondsToTimeAtTimezone

    /**
    * Method to convert a nasdaq DateTime string to luxon DateTime
    * 
    * @param {string} dateString
    * @returns {object}
    * 
    */
    static nasdaqDatetimeStringToUTC(dateString) {

        dateString = dateString.replace('ET', 'America/New_York')
        const dateStringFormat = (dateString.includes(',')) ? "LLL d, yyyy hh:mm a z" : "LLL d yyyy h:mm a z"
        // Format the date and time for UTC
        const utcDateTime = DateTime.fromFormat(dateString, dateStringFormat, { zone: 'utc' })
        return utcDateTime

    } // nasdaqDatetimeStringToUTC

    static nasdaqDatetimeStringToCron(dateString, timezone = 'local') {

        const date = this.nasdaqDatetimeStringToUTC(dateString).setZone(timezone)
        const second = date.second
        const minute = date.minute
        const hour = date.hour
        const day = date.day
        const month = date.month
        const year = date.year
        const cronExpression = `${second} ${minute}/* ${hour}/* ${day}/* ${month} * ${year}`
        return cronExpression

    } // nasdaqDatetimeStringToCron

    /**
    * Method to calculate if a date string is today
    *
    * @param {string} dateString
    * @param {string} timezone default 'America/New_York'
    * @returns {boolean}
    * 
    * https://github.com/moment/luxon/issues/313
    * 
    */
    static isToday(dateString, timezone = 'America/New_York') {
        let dateTime = DateTime.fromFormat(dateString, 'MM/dd/yyyy hh:mm:ss a', { zone: timezone })
        if (!dateTime.isValid) {
            dateTime = DateTime.fromJSDate(new Date(dateString), { zone: timezone })
            if (!dateTime.isValid) {
                throw new Error(`Invalid date string: ${dateString}`)
            }
        }
        return dateTime.toISODate() === DateTime.now({ zone: timezone }).toISODate()
    } // isToday

    /**
     * Async method to terminate your program at 
     * specified time at specified Timezone
     *
     * @param {string} cronString
     * @param {string} exitTimezone
     * 
     */
    static async exitAtSpecifiedTime(program, cronString = "@daily", exitTimezone = 'America/New_York') {

        const job = new Cron(cronString, { maxRuns: 1, timezone: exitTimezone }, () => {
            global.logger.info(`${program}: Exiting at specified time ...`)
            process.exit(0)
        })
        const exitAt = job.nextRun()
        const diff = DateTime.fromJSDate(exitAt).diffNow().toFormat('hh:mm:ss')

        global.logger.info(`${program}: Restarting in: ${diff}`)

    } // exitAtSpecifiedTime

    /**
     * Function to find the remaining time between local time
     * and time at specified Timezone in 
     *
     * @param {string} timezone
     * @param {number} hour
     * @param {number} minute
     * @param {number} second
     * @param {number} mssecond
     * @returns {number}
     * 
     */
    static msToTimeAtTimezone = (timezone = 'America/New_York', time = '23:59:59') => {

        const remaining = DateTime.fromFormat(time, 'HH:mm:ss', { zone: timezone }).diff(DateTime.now({ timeZone: timezone }))
        return Math.ceil(remaining.toMillis() / 1000)

    } // msToTimeAtTimezone

    static getDateTimeFromMedium = (dateTimeString, tz = 'America/New_York') => {

        const isDatetime = (inputString) => {
            const wordsToCheck = ["PM", "AM"]
            const pattern = new RegExp(`\\b(${wordsToCheck.join('|')})\\b`, 'i');
            return pattern.test(inputString)
        }

        const format = (isDatetime(dateTimeString)) ? 'MMM d, yyyy h:mm a' : 'MMM d, yyyy'
        const dateTime = DateTime.fromFormat(dateTimeString, format, { zone: tz })

        if (!dateTime.isValid) {
            throw new Error(`Invalid date and time string: ${dateTimeString}`)
        }
        return dateTime
    } // dateTimeFromMediumDateAndTime

    static dateTimeAtZones = (dateTime) => {
        if (!dateTime.isLuxonDateTime || !dateTime.isValid) {
            throw new Error(`Invalid date and time object: ${dateTime}`)
        }
        const utcDateTime = dateTime.setZone('utc')
        const newYorkDateTime = dateTime.setZone('America/New_York')
        const localDateTime = dateTime.setZone(global.localtimezone || 'Europe/Athens')

        const zones = {
            utc: { sql: utcDateTime.toSQL({ includeZone: true }), str: utcDateTime.toFormat("yyyy/MM/dd HH:mm:ss") },
            newYork: { sql: newYorkDateTime.toSQL({ includeZone: true }), str: newYorkDateTime.toFormat("yyyy/MM/dd HH:mm:ss") },
            local: { sql: localDateTime.toSQL({ includeZone: true }), str: localDateTime.toFormat("yyyy/MM/dd HH:mm:ss") },
        }
        zones.all = `N/Y:[${zones.newYork.str}] Local:[${zones.local.str}] UTC: [${zones.utc.str}]`

        return zones

    }

    static async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

} // DateTimeUtils

export class MiscUtils {

    static isEmpty = (obj) => {
        return Object.keys(obj).length === 0 && obj.constructor === Object
    } // isEmpty

    static isNotEmpty = (obj) => {
        return !this.isEmpty(obj)
    } // isNotEmpty
    static isNotNull = (obj) => {
        return obj !== null
    } // isNotNull
    static isNotUndefined = (obj) => {
        return obj !== undefined
    } // isNotUndefined
    static isNotNullOrUndefined = (obj) => {
        return this.isNotNull(obj) && this.isNotUndefined(obj)
    } // isNotNullOrUndefined
    static isNotNullOrUndefinedOrEmpty = (obj) => {
        return this.isNotNull(obj) && this.isNotUndefined(obj) && this.isNotEmpty(obj)
    } // isNotNullOrUndefinedOrEmpty
    static isNotNullOrUndefinedOrEmptyOrZero = (obj) => {
        return this.isNotNull(obj) && this.isNotUndefined(obj) && this.isNotEmpty(obj) && obj !== 0
    } // isNotNullOrUndefinedOrEmptyOrZero
    static isNotNullOrUndefinedOrEmptyOrZeroOrFalse = (obj) => {
        return this.isNotNull(obj) && this.isNotUndefined(obj) && this.isNotEmpty(obj) && obj !== 0 && obj !== false
    } // isNotNullOrUndefinedOrEmptyOrZeroOrFalse
    static isNotNullOrUndefinedOrEmptyOrZeroOrFalseOrNaN = (obj) => {
        return this.isNotNull(obj) && this.isNotUndefined(obj) && this.isNotEmpty(obj) && obj !== 0 && obj !== false && !isNaN(obj)
    } // isNotNullOrUndefinedOrEmptyOrZeroOrFalseOrNaN
    static isNotNullOrUndefinedOrEmptyOrZeroOrFalseOrNaNOrInfinity = (obj) => {
        return this.isNotNull(obj) && this.isNotUndefined(obj) && this.isNotEmpty(obj) && obj !== 0 && obj !== false && !isNaN(obj) && isFinite(obj)
    } // isNotNullOrUndefinedOrEmptyOrZeroOrFalseOrNaNOrInfinity
    static isNotNullOrUndefinedOrEmptyOrZeroOrFalseOrNaNOrInfinityOrObject = (obj) => {
        return this.isNotNull(obj) && this.isNotUndefined(obj) && this.isNotEmpty(obj) && obj !== 0 && obj !== false && !isNaN(obj) && isFinite(obj) && typeof obj === 'object'
    } // isNotNullOrUndefinedOrEmptyOrZeroOrFalseOrNaNOrInfinityOrObject
    static isNotNullOrUndefinedOrEmptyOrZeroOrFalseOrNaNOrInfinityOrArray = (obj) => {
        return this.isNotNull(obj) && this.isNotUndefined(obj) && this.isNotEmpty(obj) && obj !== 0 && obj !== false && !isNaN(obj) && isFinite(obj) && Array.isArray(obj)
    } // isNotNullOrUndefinedOrEmptyOrZeroOrFalseOrNaNOrInfinityOrArray
    static isNotNullOrUndefinedOrEmptyOrZeroOrFalseOrNaNOrInfinityOrString = (obj) => {
        return this.isNotNull(obj) && this.isNotUndefined(obj) && this.isNotEmpty(obj) && obj !== 0 && obj !== false && !isNaN(obj) && isFinite(obj) && typeof obj === 'string'
    } // isNotNullOrUndefinedOrEmptyOrZeroOrFalseOrNaNOrInfinityOrString
    static isNotNullOrUndefinedOrEmptyOrZeroOrFalseOrNaNOrInfinityOrFunction = (obj) => {
        return this.isNotNull(obj) && this.isNotUndefined(obj) && this.isNotEmpty(obj) && obj !== 0 && obj !== false && !isNaN(obj) && isFinite(obj) && typeof obj === 'function'
    } // isNotNullOrUndefinedOrEmptyOrZeroOrFalseOrNaNOrInfinityOrFunction
    static isNotNullOrUndefinedOrEmptyOrZeroOrFalseOrNaNOrInfinityOrBoolean = (obj) => {
        return this.isNotNull(obj) && this.isNotUndefined(obj) && this.isNotEmpty(obj) && obj !== 0 && obj !== false && !isNaN(obj) && isFinite(obj) && typeof obj === 'boolean'
    } // isNotNullOrUndefinedOrEmptyOrZeroOrFalseOrNaNOrInfinityOrBoolean
    static isNotNullOrUndefinedOrEmptyOrZeroOrFalseOrNaNOrInfinityOrSymbol = (obj) => {
        return this.isNotNull(obj) && this.isNotUndefined(obj) && this.isNotEmpty(obj) && obj !== 0 && obj !== false && !isNaN(obj) && isFinite(obj) && typeof obj === 'symbol'
    } // isNotNullOrUndefinedOrEmptyOrZeroOrFalseOrNaNOrInfinityOrSymbol
    static isNotNullOrUndefinedOrEmptyOrZeroOrFalseOrNaNOrInfinityOrBigInt = (obj) => {
        return this.isNotNull(obj) && this.isNotUndefined(obj) && this.isNotEmpty(obj) && obj !== 0 && obj !== false && !isNaN(obj) && isFinite(obj) && typeof obj === 'bigint'
    } // isNotNullOrUndefinedOrEmptyOrZeroOrFalseOrNaNOrInfinityOrBigInt
    static isNotNullOrUndefinedOrEmptyOrZeroOrFalseOrNaNOrInfinityOrDate = (obj) => {
        return this.isNotNull(obj) && this.isNotUndefined(obj) && this.isNotEmpty(obj) && obj !== 0 && obj !== false && !isNaN(obj) && isFinite(obj) && obj instanceof Date
    } // isNotNullOrUndefinedOrEmptyOrZeroOrFalseOrNaNOrInfinityOrDate
} // MiscUtils

export class StringUtils {
    static isString = (obj) => {
        return typeof obj === 'string' || obj instanceof String
    } // isString
    static isNotString = (obj) => {
        return !this.isString(obj)
    } // isNotString
    static isNotEmptyString = (obj) => {
        return this.isString(obj) && obj.length > 0
    } // isNotEmptyString
    static isNotNullOrUndefinedOrEmptyString = (obj) => {
        return this.isNotNullOrUndefined(obj) && this.isNotEmptyString(obj)
    } // isNotNullOrUndefinedOrEmptyString
    static isNotNullOrUndefinedOrEmptyStringOrZero = (obj) => {
        return this.isNotNullOrUndefinedOrEmptyString(obj) && obj !== 0
    } // isNotNullOrUndefinedOrEmptyStringOrZero
    static isNotNullOrUndefinedOrEmptyStringOrZeroOrFalse = (obj) => {
        return this.isNotNullOrUndefinedOrEmptyStringOrZero(obj) && obj !== false
    } // isNotNullOrUndefinedOrEmptyStringOrZeroOrFalse
    static isNotNullOrUndefinedOrEmptyStringOrZeroOrFalseOrNaN = (obj) => {
        return this.isNotNullOrUndefinedOrEmptyStringOrZeroOrFalse(obj) && !isNaN(obj)
    } // isNotNullOrUndefinedOrEmptyStringOrZeroOrFalseOrNaN
    static isNotNullOrUndefinedOrEmptyStringOrZeroOrFalseOrNaNOrInfinity = (obj) => {
        return this.isNotNullOrUndefinedOrEmptyStringOrZeroOrFalseOrNaN(obj) && isFinite(obj)
    } // isNotNullOrUndefinedOrEmptyStringOrZeroOrFalseOrNaNOrInfinity
    static isNotNullOrUndefinedOrEmptyStringOrZeroOrFalseOrNaNOrInfinityOrObject = (obj) => {
        return this.isNotNullOrUndefinedOrEmptyStringOrZeroOrFalseOrNaNOrInfinity(obj) && typeof obj === 'object'
    } // isNotNullOrUndefinedOrEmptyStringOrZeroOrFalseOrNaNOrInfinityOrObject
    static isNotNullOrUndefinedOrEmptyStringOrZeroOrFalseOrNaNOrInfinityOrArray = (obj) => {
        return this.isNotNullOrUndefinedOrEmptyStringOrZeroOrFalseOrNaNOrInfinityOrObject(obj) && Array.isArray(obj)
    } // isNotNullOrUndefinedOrEmptyStringOrZeroOrFalseOrNaNOrInfinityOrArray

    static capitalizeFirstLetter = (val) => {
        return String(val).charAt(0).toUpperCase() + String(val).slice(1);
    }
    static capitalizeFirstLetterOfEachWord = (str) => {
        return str.replace(/\b\w/g, char => char.toUpperCase());
    }

} // StringUtils


/**
 * Function to search into an object literal at any level for: 
 * key, value,  key && value
 * RegExp can be used also
 * contains 3 functions: forKey, forValue, forKeyValue
 *
 * @returns {object}
 * 
 * see details at https://www.npmjs.com/package/searchhash
 * 
 */
export const searchHash = (function () {
    // some utility func
    function jCompare(obj1, obj2) {
        return JSON.stringify(obj1) === JSON.stringify(obj2) && !isRegExp(obj2);
    }

    function isString(o) {
        return typeof o === 'string' || o instanceof String;
    }

    function isRegExp(o) {
        return o instanceof RegExp;
    }

    function isObj(o) {
        var t0 = String(o) !== o,
            t1 = o === Object(o),
            t2 = typeof o !== 'function',
            t3 = {}.toString.call(o).match(/\[object\sObject\]/);
        return t0 && t1 && t2 && !!(t3 && t3.length);
    }

    function isArr(o) {
        var t2 = ({}).toString.call(o).match(/\[object\sArray\]/);
        return String(o) !== o && !!(t2 && t2.length);
    }

    function isElement(o) {
        return (
            o && typeof o === 'object' && // DOM2
            typeof o.nodeType !== 'undefined' && o.nodeType === 1 &&
            typeof o.nodeName === 'string'
        );
    }

    /**
     * Main searching function
     */
    function digFor(what, rootObj, target, opts) {
        if (!isObj(rootObj) && !isArr(rootObj)) throw new Error('BAD PARAM: must search into an object or an array');
        var t,
            found = 0,
            strOrRx = function (x, y) {
                return (isString(x) && isRegExp(y)) ?
                    x.match(y) :
                    jCompare(x, y);
            },
            matches = {
                key: function (k1, k2, key) {
                    return typeof key === 'function' ? key(k1) : strOrRx(k1, key);
                },
                value: function (k1, k2, val) {
                    return typeof val === 'function' ? val(k2) : strOrRx(k2, val);
                },
                keyvalue: function (k1, k2, keyval) {
                    return (
                        (typeof keyval.key === 'function' && keyval.key(k1)) ||
                        strOrRx(k1, keyval.key)
                    ) && (
                            (typeof keyval.value === 'function' && keyval.value(k2)) ||
                            strOrRx(k2, keyval.value)
                        );
                }
            }[what],
            res = [],
            maybePush = function (objpath, index, trg, obj, level) {
                var p = [].concat.call(objpath, [index]),
                    tmp = matches(index, obj[index], trg),
                    inRange = opts.min <= level && level <= opts.max,
                    plen = p.length;
                if (inRange && tmp) {
                    res.push({
                        obj: obj,
                        value: obj[index],
                        key: p[plen - 1],
                        parentKey: p[plen - 2],
                        path: p.join('/'),
                        getter: function () {
                            return p.reduce(function (acc, el) { return acc[el]; }, rootObj);
                        },
                        container: p.slice(0, plen - 1).join('/'),
                        parentContainer: p.slice(0, plen - 2).join('/'),
                        regexp: tmp,
                        level: level
                    });
                    found++;
                }
                dig(obj[index], trg, p, level + 1);
            },
            dig = function (o, k, objpath, level) {
                if (isElement(o)) {
                    // console.log('ELEMENT');
                    return;
                }
                var i, l;
                if (o instanceof Array) {
                    for (i = 0, l = o.length; i < l; i++) {
                        maybePush(objpath, i, k, o, level);
                        if (opts.limit === found) break;
                    }
                } else if (typeof o === 'object') {
                    for (i in o) {
                        maybePush(objpath, i, k, o, level);
                        if (opts.limit === found) break;
                    }
                }
            };

        opts.limit = 'limit' in opts ? ~~(opts.limit) : Infinity;
        opts.min = 'min' in opts ? ~~(opts.min) : 0;
        opts.max = 'max' in opts ? ~~(opts.max) : Infinity;
        if (opts.limit === 0) return res;
        opts.min = opts.min < 0 ? 0 : opts.min;
        if (opts.max < opts.min) {
            t = opts.min;
            opts.min = opts.max;
            opts.max = t;
        }
        dig(rootObj, target, [], 0);
        if (opts.sorter) return res.sort(opts.sorter);
        return res;
    }

    return {
        forKey: function (o, k, opts) {
            return digFor('key', o, k, opts || {});
        },
        forValue: function (o, k, opts) {
            return digFor('value', o, k, opts || {});
        },
        forKeyValue: function (o, kv, opts) {
            return digFor('keyvalue', o, kv, opts || {});
        }
    };
})();

