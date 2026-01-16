import { URL } from 'node:url';
import { Redis } from "ioredis";
import { serializeError } from 'serialize-error';

// This Map will hold the state (logger and servers) for each subclass (e.g., ConnectRedisLocal).
// This is the correct way to manage state for static classes that are inherited,
// as it isolates the state for each subclass, preventing them from overwriting each other.
const classState = new Map();

/**
 * Retrieves or creates the state object for a given class from the module-scoped Map.
 * @param {class} cls The class constructor (e.g., ConnectRedisLocal) to use as the key.
 * @returns {{logger: object, servers: Array}} The state object for the class.
 */
function getOrInitState(cls) {
  if (!classState.has(cls)) {
    classState.set(cls, { logger: console, servers: [] });
  }
  return classState.get(cls);
}

const redis_options = {
  db: 0,
  connectTimeout: 10000,
  keepAlive: 1000,
};

/**
 * Creates a Redis client and attaches standard event listeners.
 * This is a module-scoped helper function, not a class method.
 * @param {object} logger The logger instance to use.
 * @param {string} className The name of the class for logging purposes.
 * @param {string} clientType The type of client ('Publisher' or 'Subscriber').
 * @param {object} server The server configuration object.
 * @param {string} redis_url The URL of the Redis server.
 * @returns {Redis} An ioredis client instance.
 */
function createClient(logger, className, clientType, server, redis_url) {
  const redis_host = new URL(redis_url).host;
  const client = new Redis(redis_url, redis_options);

  client.on('error', (error) => {
    logger.fatal(`${className}: ${clientType} connection error for ${server.dbName} at ${redis_host}: ${serializeError(error)}`);
  });
  client.on('connect', () => {
    logger.trace(`${className}: ${clientType} connected to [${server.dbName}] at [${redis_host}]`);
  });
  client.on('ready', () => {
    logger.trace(`${className}: ${clientType} ready at [${server.dbName}] at [${redis_host}]`);
  });
  client.on('close', () => {
    logger.trace(`${className}: ${clientType} connection closed at [${server.dbName}] at [${redis_host}]`);
  });
  client.on('reconnecting', () => {
    logger.trace(`${className}: ${clientType} reconnecting [${server.dbName}] at [${redis_host}]`);
  });

  return client;
}

export default class ConnectRedisBase {

  static serverType = ''; // MUST be overridden by subclass: 'local' or 'cloud'
  /**
   * Initializes Redis connections based on the provided configuration.
   * This method should be called once at application startup.
   * @param {object} options - The initialization options.
   * @param {object} options.config - The application configuration object.
   * @param {object} options.logger - The logger instance.
   */
  static initialize({ config, logger }) {
    if (!this.serverType) {
        throw new Error('ConnectRedisBase must be extended and the static `serverType` property must be set.');
    }
    // Get the state object for the specific subclass calling this method (e.g., ConnectRedisLocal).
    const state = getOrInitState(this);

    // Use the provided logger, or keep the default (console).
    if (logger) {
      state.logger = logger;
    }

    // Make a copy to avoid mutating the original config object
    state.servers = [...config.commonAll.db.redis[this.serverType]];

    for (const server of state.servers) {
      const { dbUrl } = server;
      try {
        // According to Redis documentation, it's best practice to have separate
        // connections for pub/sub and other commands.
        server.pubClient = createClient(state.logger, this.name, 'Publisher', server, dbUrl);
        server.subClient = createClient(state.logger, this.name, 'Subscriber', server, dbUrl);
      } catch (error) {
        state.logger.fatal(`${this.name}: Redis (${this.serverType}) connection error during initialization: ${serializeError(error)}`);
        throw error;
      }
    }
  }

  static get redisServersCount() {
    const state = getOrInitState(this);
    return state.servers.length;
  }

  static getPub(server_id = 0) {
    const state = getOrInitState(this);
    if (server_id >= state.servers.length) {
      return null;
    }
    return state.servers[server_id].pubClient;
  } // getPub

  static getSub(server_id = 0) {
    const state = getOrInitState(this);
    if (server_id >= state.servers.length) {
      return null;
    }
    return state.servers[server_id].subClient;
  } // getSub

  static async getInfo(server_id = 0) {
    const state = getOrInitState(this);
    if (server_id >= state.servers.length) {
      return null;
    }

    const server = state.servers[server_id];
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
    const state = getOrInitState(this);
    if (server_id >= state.servers.length) {
      return null;
    }
    const server = state.servers[server_id];
    if (server.pubClient) {
      await server.pubClient.quit();
      server.pubClient = null;
    }
    if (server.subClient) {
      await server.subClient.quit();
      server.subClient = null;
    }
  } // close

} // ConnectRedisBase