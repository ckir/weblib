import { URL } from "node:url";
import { Pool, types } from 'pg';

const DATE_OID = 1082;
const TIMESTAMP_OID = 1114;
const TIMESTAMPTZ_OID = 1184;
const parseTimestamp = (value) => value;
const parseDate = (value) => value;

types.setTypeParser(DATE_OID, parseDate);
types.setTypeParser(TIMESTAMP_OID, parseTimestamp);
types.setTypeParser(TIMESTAMPTZ_OID, parseTimestamp);

const findHostKey = (url) => {
  let pgHost = null;
  if (typeof url === 'string' || url instanceof String) {
    const pgHostURL = new URL(url);
    pgHost = `${pgHostURL.hostname}:${pgHostURL.port}`;
  } else {
    pgHost = `${url.host}:${url.port}`;
  }
  return pgHost;
}

const logger = global.logger;
const localPools = new Map();
const cloudPools = new Map();
const postgres_options = { max: 10, idleTimeoutMillis: 30000, connectionTimeoutMillis: 2000 };

if (localPools.size === 0) {
  for (const postgres_url of global.configData.config.db.postgres.local) {
    let pool = null;
    if (typeof postgres_url === 'string' || postgres_url instanceof String) {
      pool = new Pool({
        connectionString: postgres_url,
        postgres_options,
      });
    } else {
      pool = new Pool(postgres_url);
    }
    pool.on('connect', (client) => {
      client.query('SET DATESTYLE = "ISO, YMD"');
      client.query('SET TIME ZONE "America/New_York"');
      logger.info(`Connected to Postgres at local [${client.host}:${client.port}]`);
    });
    pool.on('error', (err) => {
      logger.error(`Postgres connection error: ${err.message}`);
    });
    const postgres_key = findHostKey(postgres_url);
    localPools.set(postgres_key, pool);
  }
}

if (cloudPools.size === 0) {
  for (const postgres_url of global.configData.config.db.postgres.cloud) {
    let pool = null;
    if (typeof postgres_url === 'string' || postgres_url instanceof String) {
      pool = new Pool({
        connectionString: postgres_url,
        postgres_options,
      });
    } else {
      pool = new Pool(postgres_url);
    }
    pool.on('connect', (client) => {
      client.query('SET DATESTYLE = "ISO, YMD"');
      client.query('SET TIME ZONE "America/New_York"');
      logger.info(`Connected to Postgres at cloud [${client.host}:${client.port}]`);
    });
    pool.on('error', (err) => {
      logger.error(`Postgres connection error: ${err.message}`);
    });
    const postgres_key = findHostKey(postgres_url);
    cloudPools.set(postgres_key, pool);
  }
}

export async function queryLocal(...args) {
  const queryPromises = Array.from(localPools.values()).map(pool => {
    return pool.query(...args)
  });
  return Promise.allSettled(queryPromises);
} // queryLocal

export async function queryCloud(...args) {
  const queryPromises = Array.from(cloudPools.values()).map(pool => {
    return pool.query(...args)
  });
  return Promise.allSettled(queryPromises);
} // queryCloud

export async function queryAll(...args) {
  const localQueryPromishes = Array.from(localPools.values()).map(pool => {
    return pool.query(...args)
  });
  const cloudQueryPromishes = Array.from(cloudPools.values()).map(pool => {
    return pool.query(...args)
  });
  const queryPromises = [...localQueryPromishes, ...cloudQueryPromishes];
  return Promise.allSettled(queryPromises);
} // queryAll

export async function closeAll() {
  const localClosePromises = Array.from(localPools.values()).map(pool => {
    return pool.end()
  });
  const cloudClosePromises = Array.from(cloudPools.values()).map(pool => {
    return pool.end()
  });
  const closePromises = [...localClosePromises, ...cloudClosePromises];
  return Promise.all(closePromises);
} // closeAll
