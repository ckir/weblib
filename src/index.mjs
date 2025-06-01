
import path from 'node:path';

async function loadModule(moduleFile) {
    const module = await import(moduleFile);
    return module.default || module;
}

export default {
    markets: {
        nasdaq: {
            apiNasdaq: async () => {
                const module = await loadModule(pathjoin('.', 'lib', 'common', 'markets', 'nasdaq', 'apiNasdaq.mjs'));
                return module;
            },
        }
    },
}