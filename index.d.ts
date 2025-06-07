// Main type definition file for the 'weblib' package.
// This file corresponds to the exports from 'src/index.mjs'.

// Import the types of the module namespace objects.
// These paths should resolve to the .d.ts files accompanying the .mjs modules.
import * as CommonModule from './src/lib/common/index';
import * as CloudflareModule from './src/lib/cloudflare/index';
import * as CloudRunModule from './src/lib/cloudrun/index';
import * as LambdaModule from './src/lib/lambda/index';

/**
 * Represents the structure of the WebLib object,
 * providing access to various utility modules.
 */
interface WebLib {
    /**
     * Common utilities and functionalities.
     * The type is inferred from the exports of 'src/lib/common/index.mjs'.
     */
    Common: typeof CommonModule;

    /**
     * Cloudflare-specific utilities.
     * The type is inferred from the exports of 'src/lib/cloudflare/index.mjs'.
     */
    Cloudflare: typeof CloudflareModule;

    /**
     * Google Cloud Run-specific utilities.
     * The type is inferred from the exports of 'src/lib/cloudrun/index.mjs'.
     */
    CloudRun: typeof CloudRunModule;

    /**
     * AWS Lambda-specific utilities.
     * The type is inferred from the exports of 'src/lib/lambda/index.mjs'.
     */
    Lambda: typeof LambdaModule;
}

// Declare the WebLib object that is the default export of the package.
declare const WebLib: WebLib;

export default WebLib;