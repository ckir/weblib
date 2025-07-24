
import { URL } from "url";
import EventEmitter from 'events';
import { Redis } from "ioredis";
import { serializeError } from 'serialize-error';

if (global.logger === undefined) {
    const { default: Logger } = await import('../LoggerDummy.mjs');
    global.logger = new Logger();
}

if (!global.configData) {
    const { sep } = await import('path');
    const { default: os } = await import('os');
    const platform = (os.platform() === 'win32') ? 'windows' : (os.platform() === 'darwin') ? 'macOS' : (os.platform() === 'linux') ? 'Linux' : os.platform();
    const { getProjectRootFolder } = await import('../Utils.mjs');
    const rootFolder = await getProjectRootFolder();
    const app_name = rootFolder.split(sep).at(-1);
    const { default: Config } = await import('../Config.mjs');
    global.configData = await Config.getConfig(app_name, platform, process.env.MODE);
}

export default class ConnectRedisMulti extends EventEmitter {

  static redisLocal = new Map(); // Store Redis clients by key
  static redisCloud = new Map(); // Store Redis clients by key

  defaults = {
    redis_options: {
      db: 0,
      connectTimeout: 10000,
      keepAlive: 1000,
      // Add a retry strategy to control reconnection attempts.
      retryStrategy(times) {
        const maxRetries = 10; // Maximum number of retries
        if (times > maxRetries) {
          // Returning null tells ioredis to stop trying to reconnect.
          // An 'error' event will be emitted on the client when the connection is lost.
          return null;
        }
        // Use exponential backoff for retries, with a max delay of 2 seconds.
        const delay = Math.min(times * 100, 2000);
        return delay;
      },
    },
  };

  constructor(options = {}) {
    super();
    this.name = constructor.name;
    this.options = { ...this.defaults, ...options };
    this.redis_options = this.options.redis_options;
    this.logger = global.logger;

    for (const redis_url of global.configData.config.db.redis.local) {
      const redis_client = new Redis(redis_url, this.redis_options);
      redis_client.on('error', (err) => {
        global.logger.error(`Redis connection error for local URL [${redis_url}]: ${err.message}`);
        this.emit('error', serializeError(err));
      });
      redis_client.on('connect', () => {
        global.logger.trace(`Connected to Redis at local URL [${redis_url}]`);
        this.emit('connect', redis_client);
      });
      redis_client.on('close', () => {
        global.logger.trace(`Connection to Redis at local URL [${redis_url}] closed`);
        this.emit('close', redis_client);
      });
      redis_client.on('reconnecting', () => {
        global.logger.trace(`Reconnecting to Redis at local URL [${redis_url}]`);
        this.emit('reconnecting', redis_client);
      });

      const parsedUrl = new URL(redis_url);
      const redis_key = `${parsedUrl.hostname}:${parsedUrl.port}`;
      ConnectRedisMulti.redisLocal.set(redis_key, redis_client);
    }

    for (const redis_url of global.configData.config.db.redis.cloud) {
      const redis_client = new Redis(redis_url, this.redis_options);
      redis_client.on('error', (err) => {
        global.logger.warn(`Redis connection error for cloud URL [${redis_url}]: ${err.message}`);
        this.emit('error', serializeError(err));
      });
      redis_client.on('connect', () => {
        global.logger.trace(`Connected to Redis at cloud URL [${redis_url}]`);
        this.emit('connect', redis_client);
      });
      redis_client.on('close', () => {
        global.logger.trace(`Connection to Redis at cloud URL [${redis_url}] closed`);
        this.emit('close', redis_client);
      });
      redis_client.on('reconnecting', () => {
        global.logger.trace(`Reconnecting to Redis at cloud URL [${redis_url}]`);
        this.emit('reconnecting', redis_client);
      });

      const parsedUrl = new URL(redis_url);
      const redis_key = `${parsedUrl.hostname}:${parsedUrl.port}`;
      ConnectRedisMulti.redisCloud.set(redis_key, redis_client);
    }

  } // constructor

  async setLocal(args) {
    const setPromises = Array.from(ConnectRedisMulti.redisLocal.values()).map(redis_client => redis_client.set(...args))
    return Promise.allSettled(setPromises);
  } // setLocal

  async setCloud(args) {
    const setPromises = Array.from(ConnectRedisMulti.redisCloud.values()).map(redis_client => redis_client.set(...args));
    return Promise.allSettled(setPromises);
  } // setCloud

  async setAll(args) {
    const localPromises = Array.from(ConnectRedisMulti.redisLocal.values()).map(redis_client => redis_client.set(...args));
    const cloudPromises = Array.from(ConnectRedisMulti.redisCloud.values()).map(redis_client => redis_client.set(...args));
    const setPromises = [...localPromises, ...cloudPromises];
    return Promise.allSettled(setPromises);
  } // setAll

  async publishLocal(args) {
    const setPromises = Array.from(ConnectRedisMulti.redisLocal.values()).map(redis_client => redis_client.publish(...args))
    return Promise.allSettled(setPromises);
  } // publishLocal

  async publishCloud(args) {
    const setPromises = Array.from(ConnectRedisMulti.redisCloud.values()).map(redis_client => redis_client.publish(...args))
    return Promise.allSettled(setPromises);
  } // publishCloud

  async publishAll(args) {
    const setPromises = [...this.publishLocal(args), ...this.publishCloud(args)];
    return Promise.allSettled(setPromises);
  } // publishAll

  async closeLocal() {
    const localPromises = Array.from(ConnectRedisMulti.redisLocal.values()).map(redis_client => redis_client.quit());
    return Promise.allSettled(localPromises);
  } // closeLocal

  async closeCloud() {
    const cloudPromises = Array.from(ConnectRedisMulti.redisCloud.values()).map(redis_client => redis_client.quit());
    return Promise.allSettled(cloudPromises);
  } // closeCloud

  async closeAll() {
    const localPromises = Array.from(ConnectRedisMulti.redisLocal.values()).map(redis_client => redis_client.quit());
    const cloudPromises = Array.from(ConnectRedisMulti.redisCloud.values()).map(redis_client => redis_client.quit());
    const closePromises = [...localPromises, ...cloudPromises];
    return Promise.allSettled(closePromises);
  } // 

} // ConnectRedisMulti
