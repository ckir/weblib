import WebLib from './index.mjs';

/**
 * Recursively prints the structure of the library in dot notation.
 *
 * @param {any} obj - The object to inspect.
 * @param {string} [path='WebLib'] - The current path.
 * @param {Set} [stack=new Set()] - Stack for circular reference detection.
 */
function printMap(obj, path = 'WebLib', stack = new Set()) {
    if (obj === null || typeof obj === 'undefined') return;

    if (stack.has(obj)) {
        console.log(`${path} [Circular]`);
        return;
    }

    console.log(path);

    if (typeof obj !== 'object') return;

    stack.add(obj);

    const keys = Object.keys(obj).sort();
    const leaves = [];
    const nodes = [];

    for (const key of keys) {
        const value = obj[key];
        if (typeof value === 'function') {
            leaves.push(key);
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            nodes.push(key);
        } else {
            leaves.push(key);
        }
    }

    if (leaves.length > 0) {
        const leafStr = leaves.length > 1 ? `(${leaves.join(',')})` : leaves[0];
        console.log(`${path}.${leafStr}`);
    }

    for (const node of nodes) {
        printMap(obj[node], `${path}.${node}`, stack);
    }

    stack.delete(obj);
}

printMap(WebLib);