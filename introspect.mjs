import WebLib from './index.mjs';

/**
 * Recursively inspects an object and returns a simplified structure representation.
 * Useful for debugging and exploring the library structure.
 * 
 * @param {any} obj - The object to inspect.
 * @param {number} [maxDepth=10] - Maximum recursion depth.
 * @returns {any} - The structure of the object.
 */
function inspect(obj, maxDepth = 10) {
    if (maxDepth < 0) return '...';
    if (obj === null) return 'null';
    if (typeof obj !== 'object' && typeof obj !== 'function') return typeof obj;
    if (Array.isArray(obj)) return `Array(${obj.length})`;

    if (typeof obj === 'function') {
        return `Function${obj.name ? ': ' + obj.name : ''}`;
    }

    const result = {};
    for (const key of Object.keys(obj)) {
        const value = obj[key];
        if (typeof value === 'object' && value !== null) {
            result[key] = inspect(value, maxDepth - 1);
        } else {
            result[key] = typeof value;
        }
    }
    return result;
}

console.log(JSON.stringify(inspect(WebLib), null, 2));