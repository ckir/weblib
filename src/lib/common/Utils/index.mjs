import ArrayUtils from './Misc/ArrayUtils.mjs';
import ConfigUtils from './Misc/ConfigUtils.mjs';
import DateTimeUtils from './Misc/DateTimeUtils.mjs';
import StringUtils from './Misc/StringUtils.mjs';
import SystemInfoCollector from './Misc/SystemInfo.mjs';
import SystemUtils from './Misc/SystemUtils.mjs';
import * as Alerts from './Alerts/index.mjs';

const Misc = {
    ArrayUtils: ArrayUtils,
    ConfigUtils: ConfigUtils,
    DateTimeUtils: DateTimeUtils,
    StringUtils: StringUtils,
    SystemInfo: SystemInfoCollector,
    SystemUtils: SystemUtils,
}

export { Alerts, Misc }