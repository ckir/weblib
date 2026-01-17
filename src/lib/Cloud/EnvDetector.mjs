/**
 * Detects the current execution environment.
 * @returns {'lambda' | 'cloud-run-function' | 'cloudflare-worker' | 'local'}
 */
export const getEnvironment = () => {
  // 1. AWS Lambda
  if (globalThis.process?.env?.AWS_LAMBDA_FUNCTION_NAME || globalThis.process?.env?.AWS_EXECUTION_ENV) {
    return 'lambda';
  }

  // 2. Cloud Run Function (GCP)
  if (globalThis.process?.env?.K_SERVICE || globalThis.process?.env?.FUNCTION_TARGET || globalThis.process?.env?.FUNCTION_SIGNATURE_TYPE) {
    return 'cloud-run-function';
  }

  // 3. Cloudflare Workers
  // We check navigator first as it's the standard for modern Workers
  if (typeof navigator !== 'undefined' && navigator.userAgent === 'Cloudflare-Workers') {
    return 'cloudflare-worker';
  }

  // 4. Default to Local
  return 'local';
};

// Exporting a constant for convenience
export const currentEnv = getEnvironment();

// Helper booleans for cleaner conditional logic
export const isLambda = currentEnv === 'lambda';
export const isCloudRun = currentEnv === 'cloud-run-function';
export const isWorker = currentEnv === 'cloudflare-worker';
export const isLocal = currentEnv === 'local';
