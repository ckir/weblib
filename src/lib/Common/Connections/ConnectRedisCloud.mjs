import { URL } from 'url';
import { Redis } from "ioredis";
import { serializeError } from 'serialize-error';

if (global.logger === undefined) {
  const { default: Logger } = await import('../Loggers/LoggerDummy.mjs');
  global.logger = new Logger();
}

if (!global.configData) {
  const { default: ConfigCloud } = await import('../Configs/ConfigCloud.mjs');
  global.configData = await ConfigCloud.getCloudConfig();
}

const redis_options = {
  db: 0,
  connectTimeout: 10000,
  keepAlive: 1000,
};

export default class ConnectRedisCloud {

  static #logger = console;
  static #servers = [];

  /**
   * Creates a Redis client and attaches standard event listeners.
   * @private
   */
  static #createClient(clientType, server, redis_url) {
    const redis_host = new URL(redis_url).host;
    const client = new Redis(redis_url, redis_options);

    client.on('error', (error) => {
      this.#logger.fatal(`${this.name}: ${clientType} connection error for ${server.dbName} at ${redis_host}: ${serializeError(error)}`);
    });
    client.on('connect', () => {
      this.#logger.trace(`${this.name}: ${clientType} connected to [${server.dbName}] at [${redis_host}]`);
    });
    client.on('ready', () => {
      this.#logger.trace(`${this.name}: ${clientType} ready at [${server.dbName}] at [${redis_host}]`);
    });
    client.on('close', () => {
      this.#logger.trace(`${this.name}: ${clientType} connection closed at [${server.dbName}] at [${redis_host}]`);
    });
    client.on('reconnecting', () => {
      this.#logger.trace(`${this.name}: ${clientType} reconnecting [${server.dbName}] at [${redis_host}]`);
    });

    return client;
  }

  /**
   * Initializes Redis connections based on the provided configuration.
   * This method should be called once at application startup.
   * @param {object} options - The initialization options.
   * @param {object} options.config - The application configuration object.
   * @param {object} options.logger - The logger instance.
   */
  static initialize({ config, logger }) {
    this.#logger = logger;
    // Make a copy to avoid mutating the original config object
    this.#servers = [...config.commonAll.db.redis.cloud];

    for (const server of this.#servers) {
      const { dbUrl } = server;
      try {
        // According to Redis documentation, it's best practice to have separate
        // connections for pub/sub and other commands.
        server.pubClient = this.#createClient('Publisher', server, dbUrl);
        server.subClient = this.#createClient('Subscriber', server, dbUrl);
      } catch (error) {
        this.#logger.fatal(`${this.name}: Redis cloud connection error during initialization: ${serializeError(error)}`);
        throw error;
      }
    }
  }

  static get cloudRedisServersCount() {
    return this.#servers.length;
  }

  static getPub(server_id = 0) {
    if (server_id >= this.#servers.length) {
      return null;
    }
    return this.#servers[server_id].pubClient;
  } // getPub

  static getSub(server_id = 0) {
    if (server_id >= this.#servers.length) {
      return null;
    }
    return this.#servers[server_id].subClient;
  } // getSub

  static getServer(server_id = 0) {
    if (server_id >= this.#servers.length) {
      return null;
    }
    return this.#servers[server_id];
  } // getServer  

  static async getInfo(server_id = 0) {

    if (server_id >= this.#servers.length) {
      return null;
    }

    const server = this.#servers[server_id];
    // Create a temporary client for the INFO command to avoid blocking other operations.
    const cli = new Redis(server.dbUrl, redis_options);

    const infoString = await cli.info();
    await cli.quit();

    let redisVersion = null;
    if (infoString) {
      // Use a regex to find the redis_version line in the INFO command output
      const match = infoString.match(/^redis_version:(.*)$/m);
      if (match && match[1]) {
        redisVersion = match[1].trim();
      }
    }

    return {
      dbName: server.dbName,
      dbHost:  new URL(server.dbUrl).host,
      dbInfo: infoString || null,
      redisVersion: redisVersion,
    };

  } // getInfo

  static async close(server_id = 0) {
    if (server_id >= this.#servers.length) {
      return null;
    }
    const server = this.#servers[server_id];
    if (server.pubClient) {
      await server.pubClient.quit();
      server.pubClient = null;
    }
    if (server.subClient) {
      await server.subClient.quit();
      server.subClient = null;
    }
  } // close  

} // ConnectRedisCloud


ConnectRedisCloud.initialize({ config: global.configData, logger: global.logger });

// const pubClient = ConnectRedisCloud.getPub();
// const subClient = ConnectRedisCloud.getSub();
// const info1 = await ConnectRedisCloud.getInfo(0);
// console.log('Redis Info:', info1);
// const info2 = await ConnectRedisCloud.getInfo(1);
// console.log('Redis Info:', info2);
