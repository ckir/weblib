export default class StringUtils {
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