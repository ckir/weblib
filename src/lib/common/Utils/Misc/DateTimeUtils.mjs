import { DateTime } from "luxon";
import { Cron } from 'croner';

export default class DateTimeUtils {

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

export { DateTimeUtils };