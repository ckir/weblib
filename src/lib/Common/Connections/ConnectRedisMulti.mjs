
import ConnectRedis from './ConnectRedis.mjs';
import ConnectRedisCloud from './ConnectRedisCloud.mjs';

if (globalThis.logger === undefined) {
  const { default: Logger } = await import('../Loggers/LoggerDummy.mjs');
  globalThis.logger = new Logger();
}

export default class ConnectRedisMulti {

  /**
   * Executes a command (e.g., 'set', 'publish') on all publisher clients for a given connection class.
   * @private
   * @param {class} connectionClass - The connection class (ConnectRedis or ConnectRedisCloud).
   * @param {string} serverCountProperty - The name of the static property that holds the server count.
   * @param {string} command - The name of the command to execute on the client.
   * @param {Array} args - The arguments to pass to the command.
   * @returns {Promise[]} An array of promises for the command execution.
   */
  static #executeCommandOn(connectionClass, serverCountProperty, command, args) {
    const promises = [];
    const serverCount = connectionClass[serverCountProperty];
    for (let i = 0; i < serverCount; i++) {
      const client = connectionClass.getPub(i);
      if (client) {
        promises.push(client[command](...args));
      }
    }
    return promises;
  }

  /**
   * Closes all connections for a given connection class.
   * @private
   * @param {class} connectionClass - The connection class (ConnectRedis or ConnectRedisCloud).
   * @param {string} serverCountProperty - The name of the static property that holds the server count.
   * @returns {Promise[]} An array of promises for the close operation.
   */
  static #closeConnections(connectionClass, serverCountProperty) {
    const promises = [];
    const serverCount = connectionClass[serverCountProperty];
    for (let i = 0; i < serverCount; i++) {
      promises.push(connectionClass.close(i));
    }
    return promises;
  }

  // --- SET Methods ---

  static async setLocal(args) {
    const promises = this.#executeCommandOn(ConnectRedis, 'localRedisServersCount', 'set', args);
    return Promise.allSettled(promises);
  }

  static async setCloud(args) {
    const promises = this.#executeCommandOn(ConnectRedisCloud, 'cloudRedisServersCount', 'set', args);
    return Promise.allSettled(promises);
  }

  static async setAll(args) {
    const localPromises = this.#executeCommandOn(ConnectRedis, 'localRedisServersCount', 'set', args);
    const cloudPromises = this.#executeCommandOn(ConnectRedisCloud, 'cloudRedisServersCount', 'set', args);
    return Promise.allSettled([...localPromises, ...cloudPromises]);
  }

  // --- PUBLISH Methods ---

  static async publishLocal(args) {
    const promises = this.#executeCommandOn(ConnectRedis, 'localRedisServersCount', 'publish', args);
    return Promise.allSettled(promises);
  }

  static async publishCloud(args) {
    const promises = this.#executeCommandOn(ConnectRedisCloud, 'cloudRedisServersCount', 'publish', args);
    return Promise.allSettled(promises);
  }

  static async publishAll(args) {
    const localPromises = this.#executeCommandOn(ConnectRedis, 'localRedisServersCount', 'publish', args);
    const cloudPromises = this.#executeCommandOn(ConnectRedisCloud, 'cloudRedisServersCount', 'publish', args);
    return Promise.allSettled([...localPromises, ...cloudPromises]);
  }

  // --- CLOSE Methods ---

  static async closeLocal() {
    const promises = this.#closeConnections(ConnectRedis, 'localRedisServersCount');
    return Promise.allSettled(promises);
  }

  static async closeCloud() {
    const promises = this.#closeConnections(ConnectRedisCloud, 'cloudRedisServersCount');
    return Promise.allSettled(promises);
  }

  static async closeAll() {
    const localPromises = this.#closeConnections(ConnectRedis, 'localRedisServersCount');
    const cloudPromises = this.#closeConnections(ConnectRedisCloud, 'cloudRedisServersCount');
    return Promise.allSettled([...localPromises, ...cloudPromises]);
  }

} // ConnectRedisMulti

// Example Usage:
// const testLocalSet = await ConnectRedisMulti.setLocal(['testKey', 'testValue']);
// const testCloudSet = await ConnectRedisMulti.setCloud(['testKey', 'testValue']);
// // const testAllSet = await ConnectRedisMulti.setAll(['testKey', 'testValue']);
// await ConnectRedisMulti.closeAll();
