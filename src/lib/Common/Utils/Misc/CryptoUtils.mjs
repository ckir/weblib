/**
 * A utility class for AES-256-CBC encryption and decryption with HMAC-SHA256 for authentication.
 * This class uses Node.js's built-in `crypto` module and provides authenticated encryption.
 */
export default class CryptoUtils {
  // --- Constants for AES-256-CBC + HMAC-SHA256 ---
  static ALGORITHM = 'aes-256-cbc';
  static IV_LENGTH_BYTES = 16;   // For AES, IV length is always 16 bytes
  static HMAC_ALGORITHM = 'sha256';
  static HMAC_DIGEST_LENGTH_BYTES = 32; // SHA256 produces 32 bytes (256 bits)
  static KEY_LENGTH_BYTES = 32;     // For AES-256, key length is 32 bytes (256 bits)
  static KEY_HEX_LENGTH = CryptoUtils.KEY_LENGTH_BYTES * 2; // 32 bytes * 2 hex chars/byte = 64 hex characters

  /**
   * Generates a cryptographically secure random key for AES-256.
   * This key will serve as the master key from which AES and HMAC keys are derived.
   * This function should be used *once* to generate your secret master key.
   *
   * @returns {string} A hexadecimal-encoded random 32-byte (256-bit) key.
   */
  static generateRandomMasterKey() {
    return crypto.randomBytes(CryptoUtils.KEY_LENGTH_BYTES).toString('hex');
  }

  /**
   * Derives separate AES and HMAC keys from a single master key.
   * It is best practice to derive distinct keys for encryption and authentication.
   *
   * @param {Buffer} masterKeyBuffer The master key as a Buffer.
   * @returns {{aesKey: Buffer, hmacKey: Buffer}} An object containing the derived AES and HMAC keys.
   */
  static _deriveKeys(masterKeyBuffer) {
    // Simple key derivation for demo. For passwords, use PBKDF2 or scrypt.
    // For general secrets, HKDF is a good choice.
    // Appending unique context strings ensures distinct keys.
    const aesKey = crypto.createHash('sha256')
      .update(masterKeyBuffer)
      .update('aes-key-context') // Unique context
      .digest();
    const hmacKey = crypto.createHash('sha256')
      .update(masterKeyBuffer)
      .update('hmac-key-context') // Unique context
      .digest();

    return { aesKey, hmacKey };
  }

  /**
   * Encrypts a string using AES-256-CBC and adds an HMAC-SHA256 for authentication.
   *
   * @param {string} plaintext The string to encrypt.
   * @param {string} masterKeyHex The master secret key as a 64-character hexadecimal string.
   * @returns {string} The encrypted data, Base64-encoded, in the format "IV_Base64:HMAC_Base64:Ciphertext_Base64".
   * @throws {Error} If encryption fails or masterKey is invalid.
   */
  static encryptAES256(plaintext, masterKeyHex = process.env.WEBLIB_AES_PASSWORD) {
    if (typeof masterKeyHex !== 'string' || masterKeyHex.length !== CryptoUtils.KEY_HEX_LENGTH) {
      throw new Error(`Invalid hexadecimal master key. Expected a ${CryptoUtils.KEY_HEX_LENGTH}-character string.`);
    }
    const masterKeyBuffer = Buffer.from(masterKeyHex, 'hex');
    const { aesKey, hmacKey } = CryptoUtils._deriveKeys(masterKeyBuffer);

    const iv = crypto.randomBytes(CryptoUtils.IV_LENGTH_BYTES);
    const cipher = crypto.createCipheriv(CryptoUtils.ALGORITHM, aesKey, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    // Compute HMAC over the IV and ciphertext to ensure integrity
    const dataToMac = Buffer.concat([iv, Buffer.from(encrypted, 'base64')]);
    const hmac = crypto.createHmac(CryptoUtils.HMAC_ALGORITHM, hmacKey);
    hmac.update(dataToMac);
    const hmacDigest = hmac.digest('base64');

    // Output format: IV_Base64:HMAC_Base64:Ciphertext_Base64
    return `${iv.toString('base64')}:${hmacDigest}:${encrypted}`;
  } // encryptAES256

  /**
   * Decrypts an AES-256-CBC encrypted string and verifies its HMAC-SHA256.
   *
   * @param {string} encryptedString The Base64-encoded string in the format "IV_Base64:HMAC_Base64:Ciphertext_Base64".
   * @param {string} masterKeyHex The master secret key (hex string) used for encryption.
   * @returns {string|null} The decrypted plaintext string, or null if decryption/authentication fails.
   * @throws {Error} If the encrypted string format is invalid or masterKey is invalid.
   */
  static decryptAES256(encryptedString, masterKeyHex = process.env.WEBLIB_AES_PASSWORD) {
    if (typeof masterKeyHex !== 'string' || masterKeyHex.length !== CryptoUtils.KEY_HEX_LENGTH) {
      throw new Error(`Invalid hexadecimal master key. Expected a ${CryptoUtils.KEY_HEX_LENGTH}-character string.`);
    }
    const masterKeyBuffer = Buffer.from(masterKeyHex, 'hex');
    const { aesKey, hmacKey } = CryptoUtils._deriveKeys(masterKeyBuffer);

    const parts = encryptedString.split(':');
    if (parts.length !== 3) {
      console.error('Invalid encrypted string format. Expected "IV:HMAC:CIPHERTEXT".');
      return null;
    }

    const ivBase64 = parts[0];
    const receivedHmacBase64 = parts[1];
    const ciphertextBase64 = parts[2];

    try {
      const iv = Buffer.from(ivBase64, 'base64');
      const ciphertextBuffer = Buffer.from(ciphertextBase64, 'base64');

      // 1. Verify HMAC first (MANDATORY for integrity)
      const dataToMac = Buffer.concat([iv, ciphertextBuffer]);
      const hmac = crypto.createHmac(CryptoUtils.HMAC_ALGORITHM, hmacKey);
      hmac.update(dataToMac);
      const computedHmacDigest = hmac.digest('base64');

      // Use `timingSafeEqual` to prevent timing attacks when comparing MACs
      if (!crypto.timingSafeEqual(Buffer.from(receivedHmacBase64, 'base64'), Buffer.from(computedHmacDigest, 'base64'))) {
        console.error('HMAC verification failed. Data may be tampered with or key is incorrect.');
        return null;
      }

      // 2. If HMAC is valid, proceed with decryption
      const decipher = crypto.createDecipheriv(CryptoUtils.ALGORITHM, aesKey, iv);
      let decrypted = decipher.update(ciphertextBuffer, null, 'utf8'); // input buffer, no input encoding
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error.message);
      return null;
    }
  } // decryptAES256

} // CryptoUtils
