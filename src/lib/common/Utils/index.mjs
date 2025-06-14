import ArrayUtils from './Misc/ArrayUtils.mjs';
import ConfigUtils from './Misc/ConfigUtils.mjs';
import DateTimeUtils from './Misc/DateTimeUtils.mjs';
import StringUtils from './Misc/StringUtils.mjs'
import AlertTelegram from './Alerts/AlertTelegram.mjs'

const Alerts = {
    AlertTelegram: AlertTelegram
}

const Misc = {
    ArrayUtils: ArrayUtils,
    ConfigUtils: ConfigUtils,
    DateTimeUtils: DateTimeUtils,
    StringUtils: StringUtils,
}

export { Alerts, Misc }