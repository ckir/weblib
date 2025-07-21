import { KeyvSqlite } from '@ckir/keyv-sqlite';
import Keyv from "keyv";
import { join } from 'node:path';

// SQLite :memory: cache store
// const keyv = new Keyv(new KeyvSqlite());

// On disk cache on caches table
const keyv = new Keyv(new KeyvSqlite({uri: join(process.cwd(), 'cache.sqlite3')}));
await keyv.set('foo', 'expires in 1 second', 1000);
await keyv.set('bar', 'never expires');
let a = await keyv.get('bar');
console.log('Cache test:', a); // Should print 'never expires'
