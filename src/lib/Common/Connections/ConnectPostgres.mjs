import { Pool, types } from 'pg';

const DATE_OID = 1082;
const TIMESTAMP_OID = 1114;
const TIMESTAMPTZ_OID = 1184;
const parseTimestamp = (value) => value;
const parseDate = (value) => value;

types.setTypeParser(DATE_OID, parseDate);
types.setTypeParser(TIMESTAMP_OID, parseTimestamp);
types.setTypeParser(TIMESTAMPTZ_OID, parseTimestamp);

export default class ConnectPostgres {

  static pool = null;

  static getPool() {
    if (this.pool) return this.pool;
    const connectionString = global.configData.config.db.postgres.local[0];
    this.pool = new Pool({
      connectionString,
    });
    this.pool.on('connect', (client) => {
      client.query('SET DATESTYLE = "ISO, YMD"');
      client.query('SET TIME ZONE "America/New_York"');
    });
    return this.pool;
  } // getPool

} // ConnectPostgres
