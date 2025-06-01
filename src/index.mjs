
import path from 'path';
import { fileURLToPath } from 'node:url';
import { dirname, basename, sep, extname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const script_name = basename(__filename, extname(__filename));

async function loadModule(moduleFile) {
    const module = await import(moduleFile);
    return module.default || module;
}

export default {
    markets: {
        nasdaq: {
            apiNasdaq: async () => {
                const module = await loadModule(path.join(__dirname, 'lib', 'common', 'markets', 'nasdaq', 'apiNasdaq.mjs'));
                return module;
            },
        }
    },
    // apiNasdaqFetch: async (url) => {
    //     const module = await loadModule('apiNasdaq');
    //     return module(url);
    // },
    // apiErrorToString: async (status) => {
    //     const module = await loadModule('apiNasdaq');
    //     return module.apiErrorToString(status);
    // }
}