export default class SystemUtils {

	/**
	 * Detects the current JavaScript execution environment (e.g., AWS Lambda,
	 * Cloudflare Worker, Google Cloud Function, Node.js, Browser).
	 *
	 * @returns {string} A string indicating the detected environment.
	 * Possible values: 'aws_lambda', 'google_cloud_function', 'cloudflare_worker',
	 * 'nodejs_local', 'browser', 'unknown'.
	 */
	static getExecutionEnvironment() {
		// --- 1. AWS Lambda Detection ---
		// AWS Lambda injects specific environment variables.
		// AWS_LAMBDA_FUNCTION_NAME is always present.
		// AWS_EXECUTION_ENV provides details about the runtime (e.g., AWS_Lambda_nodejs18.x).
		if (typeof process !== 'undefined' && process.env &&
			(process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.AWS_EXECUTION_ENV)) {
			return 'aws_lambda';
		}

		// --- 2. Google Cloud Functions Detection ---
		// GCF injects specific environment variables.
		// FUNCTION_TARGET (1st gen) or K_SERVICE (2nd gen/Cloud Run based) are strong indicators.
		// GOOGLE_CLOUD_PROJECT is also common.
		if (typeof process !== 'undefined' && process.env &&
			(process.env.FUNCTION_TARGET || process.env.K_SERVICE || process.env.GOOGLE_CLOUD_PROJECT)) {
			return 'google_cloud_function';
		}

		// --- 3. Cloudflare Workers Detection ---
		// Cloudflare Workers run in a V8 isolate (Service Worker-like environment), not Node.js.
		// They do NOT have a `process` global or `require`.
		// They expose `self` (global scope for Workers) and `addEventListener` (for 'fetch' event).
		// This check should come AFTER Node.js-based serverless environments.
		if (typeof self !== 'undefined' &&
			typeof addEventListener === 'function' &&
			typeof process === 'undefined') {
			try {
				// Attempt to use a Worker-specific API to be more certain
				// Workers' global scope is `self`, and they register event listeners.
				self.addEventListener('fetch', () => {
					/* noop */ }); // Just a check, won't actually run handler
				return 'cloudflare_worker';
				// eslint-disable-next-line no-unused-vars    
			} catch (e) {
				// If addEventListener throws an error when trying to bind to 'fetch',
				// it's likely not a Cloudflare Worker or a compatible Service Worker environment.
			}
		}

		// --- 4. General Node.js Environment Detection ---
		// Check for the `process` global and its `versions.node` property.
		if (typeof process !== 'undefined' && process.versions && process.versions.node) {
			return 'nodejs_local';
		}

		// --- 5. Browser Environment Detection ---
		// Check for browser-specific globals like `window` and `document`.
		if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
			return 'browser';
		}

		// --- 6. Unknown Environment ---
		return 'unknown';
        
	} // getExecutionEnvironment

	/**
	 * Async method to find the parent folder name 
	 * of the folder containing the 'package.json' file
	 *
	 * @returns {Promise<string>}
	 * 
	 */
	static async getProjectRootFolder() {

		const path = await import('node:path')
		const url = await import('node:url')
		const fs = await import('node:fs')
		const __filename = url.fileURLToPath(import.meta.url)
		const __dirname = path.dirname(__filename)

		let currentDir = __dirname;
		let packageJsonPath = '';
		const rootDir = path.parse(process.cwd()).root;

		while (currentDir !== rootDir) {
			const potentialPackageJsonPath = path.resolve(currentDir, 'package.json');

			if (fs.existsSync(potentialPackageJsonPath)) {
				packageJsonPath = potentialPackageJsonPath.split(path.sep).at(-2)
				return fs.realpathSync(path.join(packageJsonPath, '..'))
			} else {
				currentDir = path.resolve(currentDir, '..');
			}
		}

	} // getProjectRootFolder 

} // SystemUtils