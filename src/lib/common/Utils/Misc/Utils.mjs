

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

