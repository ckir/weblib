import crypto from 'crypto';
import RequestUnlimited from '../Retrieve/RequestUnlimited.mjs';

const ALGORITHM = 'aes-256-cbc';
const KEY_LENGTH_BYTES = 32; // 256 bits
const IV_LENGTH_BYTES = 16;  // 128 bits

/**
 * Decrypts a Base64 encoded AES-256 CBC ciphertext using a Hex encoded key.
 *
 * @param {string} ciphertextBase64 The encrypted data, Base64 encoded.
 * @param {string} keyHex The secret key, Hex encoded (must be 32 bytes/64 hex characters after decoding).
 * @param {string} ivBase64 The Initialization Vector (IV), Base64 encoded (must be 16 bytes after decoding).
 * @param {BufferEncoding} [outputEncoding='utf8'] The encoding of the original plaintext (e.g., 'utf8', 'hex', 'base64').
 * @returns {string} The decrypted plaintext string.
 * @throws {Error} If key/IV lengths are incorrect, or if decryption fails (e.g., invalid key/IV, corrupted ciphertext).
 */
function decryptAes256Cbc(ciphertextBase64, keyHex, ivBase64, outputEncoding = 'utf8') {
    try {
        // 1. Decode inputs to Buffers
        // Key is now decoded from 'hex'
        const keyBuffer = Buffer.from(keyHex, 'hex');
        const ivBuffer = Buffer.from(ivBase64, 'base64');
        const ciphertextBuffer = Buffer.from(ciphertextBase64, 'base64');

        // 2. Validate key and IV lengths
        if (keyBuffer.length !== KEY_LENGTH_BYTES) {
            throw new Error(`Invalid key length. Expected ${KEY_LENGTH_BYTES} bytes (${KEY_LENGTH_BYTES * 2} hex characters), got ${keyBuffer.length}.`);
        }
        if (ivBuffer.length !== IV_LENGTH_BYTES) {
            throw new Error(`Invalid IV length. Expected ${IV_LENGTH_BYTES} bytes, got ${ivBuffer.length}.`);
        }

        // 3. Create a decipher instance
        const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, ivBuffer);

        // 4. Decrypt the ciphertext
        let decrypted = decipher.update(ciphertextBuffer);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        // 5. Convert the decrypted Buffer to the desired string encoding
        return decrypted.toString(outputEncoding);

    } catch (error) {
        if (error.code === 'ERR_OSSL_EVP_BAD_DECRYPT' || error.message.includes('padding')) {
            throw new Error('Decryption failed. This often indicates an incorrect key, IV, or corrupted ciphertext.');
        }
        throw new Error(`Decryption process error: ${error.message}`);
    }
} // decryptAes256Cbc

/**
 * Encrypts plaintext using AES-256 CBC and returns Base64 encoded ciphertext,
 * Hex encoded key, and Base64 encoded IV.
 * This function is useful for generating test data for the decrypt function.
 *
 * @param {string} plaintext The data to encrypt.
 * @param {BufferEncoding} [inputEncoding='utf8'] The encoding of the plaintext.
 * @returns {{ciphertextBase64: string, keyHex: string, ivBase64: string}} An object containing the Base64 encoded ciphertext, Hex encoded key, and Base64 encoded IV.
 */
// eslint-disable-next-line no-unused-vars
function encryptAes256Cbc(plaintext, inputEncoding = 'utf8') {
    // Generate a random 256-bit key
    const key = crypto.randomBytes(KEY_LENGTH_BYTES);
    // Generate a random 128-bit IV
    const iv = crypto.randomBytes(IV_LENGTH_BYTES);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, inputEncoding);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return {
        ciphertextBase64: encrypted.toString('base64'),
        keyHex: key.toString('hex'), // Key is now returned in hex format
        ivBase64: iv.toString('base64')
    };
} // encryptAes256Cbc

export default class ConfigCloud {

    /**
       * Retrieves and decrypts the cloud configuration from a specified URL.
       *
       * This method first checks if the configuration has already been loaded and cached.
       * If not, it attempts to fetch an encrypted configuration file from the provided `cloudConfigUrl`
       * (or from script properties if not provided). The fetched content is expected to contain
       * the Base64 encoded Initialization Vector (IV) on the first line and the Base64 encoded
       * AES-256 CBC ciphertext on the second line.
       *
       * It then decrypts this content using the specified `passphrase` (or from script properties).
       * The decryption uses AES-256 in CBC mode with PKCS7 padding, leveraging the CryptoJS library.
       * Finally, the decrypted plaintext is parsed as a JSON object, cached internally, and returned.
       *
       * @param {string} [cloudConfigUrl=null] Optional. The URL from which to fetch the encrypted cloud configuration.
       * If not provided, the method will attempt to retrieve 'CLOUD_CONFIG_URL' from Script Properties.
       * @param {string} [passphrase=null] Optional. The AES key in hexadecimal format (32 bytes / 256 bits) used for decryption.
       * If not provided, the method will attempt to retrieve 'AES_PASSWORD' from Script Properties.
       * @returns {object} The decrypted and parsed cloud configuration as a JSON object.
       * @throws {Error} If the `cloudConfigUrl` or `passphrase` are not provided and cannot be found in Script Properties.
       * @throws {Error} If fetching the encrypted configuration fails after retries.
       * @throws {Error} If decryption fails (e.g., incorrect passphrase, invalid IV/ciphertext format).
       * @throws {Error} If the decrypted content cannot be parsed as a valid JSON object.
       */
    static async getCloudConfig(cloudConfigUrl = null, passphrase = null) {

        if (this.cloudConfig) return this.cloudConfig;

        cloudConfigUrl = cloudConfigUrl || process.env.WEBLIB_CLOUD_CONFIG_URL || null;
        passphrase = passphrase || process.env.WEBLIB_AES_PASSWORD || null;
        if (!cloudConfigUrl) {
            if (!passphrase) {
                throw new Error('Both cloudConfigUrl and passphrase must be provided or set in script properties.');
            }
        }

        let encryptedText = null;
        let iv = null;
        try {
            let response = await RequestUnlimited.endPoint(cloudConfigUrl, { headers: { 'Accept': '*/*' } });
            if (response.status !== 'success') {
                global.logger.fatal(`Failed to fetch cloud config: ${response.status} ${response.statusText}`);
                throw new Error(`Failed to fetch cloud config: ${response.status} ${response.statusText}`);
            }
            response = response.value.body;
            const encrypteLines = response.split(/\r\n|\r|\n/);
            iv = encrypteLines[0].trim();
            encryptedText = encrypteLines[1].trim();
        } catch (e) {
            global.logger.fatal(`Failed after retries (single fetch): ${e.message}`);
            throw e;
        }

        let unencryptedText = null;
        try {
            unencryptedText = decryptAes256Cbc(encryptedText, passphrase, iv, 'utf8');
        } catch (e) {
            global.logger.fatal(`Failed to decrypt: ${e.message}`);
            throw e
        }

        let configJson = null;
        try {
            configJson = JSON.parse(unencryptedText);
        } catch (e) {
            global.logger.fatal(`Failed to convert to json: ${e.message}`);
            throw e
        }

        this.cloudConfig = configJson;
        return configJson

    } // getCloudConfig

} // ConfigCloud

// const test = await ConfigCloud.getCloudConfig();
// console.log(test);
//