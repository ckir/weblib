import os from 'node:os';
import process from 'node:process';

/**
 * A class to gather and encapsulate system and process information.
 */
export default class SystemInfoCollector {
    /**
     * @param {string[]} [sensitiveEnvKeys=[]] An array of strings representing
     * parts of environment variable names to be considered sensitive and redacted.
     */
    constructor(sensitiveEnvKeys = []) {
        // Default sensitive keys, which can be extended or overridden
        this.defaultSensitiveKeys = [
            'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'DB_PASSWORD', 'API_KEY',
            'TOKEN', 'PASSWORD', 'SECRET', 'KEY', 'CREDENTIAL', 'CONN_STRING'
        ];
        // Combine default keys with any custom keys provided
        this.sensitiveKeys = [...new Set([...this.defaultSensitiveKeys, ...sensitiveEnvKeys])];
    }

    /**
     * Gathers current operating system information.
     * @returns {object} An object containing OS details.
     * @private
     */
    _getOsInfo() {
        return {
            platform: os.platform(),
            type: os.type(),
            release: os.release(),
            arch: os.arch(),
            hostname: os.hostname(),
            uptime: os.uptime(),
            loadavg: os.loadavg(),
            totalMemoryBytes: os.totalmem(),
            freeMemoryBytes: os.freemem(),
            cpus: os.cpus().map(cpu => ({
                model: cpu.model,
                speed: cpu.speed,
                times: {
                    user: cpu.times.user,
                    nice: cpu.times.nice,
                    sys: cpu.times.sys,
                    idle: cpu.times.idle,
                    irq: cpu.times.irq
                }
            })),
            networkInterfaces: this._formatNetworkInterfaces(os.networkInterfaces()),
            userInfo: os.userInfo(),
            tmpdir: os.tmpdir(),
        };
    }

    /**
     * Gathers current Node.js process information.
     * @returns {object} An object containing process details.
     * @private
     */
    _getProcessInfo() {
        const processCpuUsage = process.cpuUsage();

        return {
            pid: process.pid,
            ppid: process.ppid,
            uptime: process.uptime(),
            execPath: process.execPath,
            cwd: process.cwd(),
            version: process.version,
            versions: process.versions,
            argv: process.argv,
            env: this._filterEnvVariables(process.env),
            memoryUsage: process.memoryUsage(),
            cpuUsage: {
                user: processCpuUsage.user,
                system: processCpuUsage.system
            },
        };
    }

    /**
     * Formats the raw output of os.networkInterfaces() for better readability.
     * Filters out internal interfaces by default.
     * @param {object} interfaces The object returned by os.networkInterfaces().
     * @returns {object} A more concise representation of network interfaces.
     * @private
     */
    _formatNetworkInterfaces(interfaces) {
        const formatted = {};
        for (const name in interfaces) {
            if (Object.hasOwnProperty.call(interfaces, name)) {
                const ifaceDetails = interfaces[name];
                const publicInterfaces = ifaceDetails.filter(detail => !detail.internal);

                if (publicInterfaces.length > 0) {
                    formatted[name] = publicInterfaces.map(detail => ({
                        address: detail.address,
                        netmask: detail.netmask,
                        family: detail.family,
                        mac: detail.mac,
                        cidr: detail.cidr,
                        scopeid: detail.scopeid
                    }));
                }
            }
        }
        return formatted;
    }

    /**
     * Filters sensitive or excessively verbose environment variables.
     * Uses the `sensitiveKeys` array configured in the constructor.
     * @param {object} env The process.env object.
     * @returns {object} A filtered copy of environment variables.
     * @private
     */
    _filterEnvVariables(env) {
        const filteredEnv = {};
        // Access sensitiveKeys from the instance
        const sensitiveKeys = this.sensitiveKeys;

        for (const key in env) {
            if (Object.hasOwnProperty.call(env, key)) {
                const isSensitive = sensitiveKeys.some(sensitiveKeyPart => key.toUpperCase().includes(sensitiveKeyPart.toUpperCase()));
                if (!isSensitive) {
                    filteredEnv[key] = env[key];
                } else {
                    filteredEnv[key] = '[REDACTED]';
                }
            }
        }
        return filteredEnv;
    }

    /**
     * Gathers comprehensive system and process information into a single JSON object.
     * This is the primary public method of the class.
     *
     * @returns {object} A JSON object containing system and process information.
     */
    getSysInfo() {
        const NOW_MS = Date.now();

        const sysinfo = {
            timestamp: NOW_MS,
            os: this._getOsInfo(),
            process: this._getProcessInfo(),
        };

        return sysinfo;
    }

} // SystemInfoCollector
