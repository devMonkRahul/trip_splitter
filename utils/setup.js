'use strict';
const config = require('../config');
const db = require('../config/db');
const migrateSingleTrip = require('./migrate');

let ready = null;

// Connects to MongoDB and prepares the data once per process. On Vercel there is no
// long-running server, so each function instance does this on its first request and
// reuses the connection after that. If it fails, the next request tries again.
function prepare() {
  if (!ready) {
    ready = (async () => {
      const conn = await db.connect(config.mongoUri);
      await migrateSingleTrip();
      return conn;
    })().catch((err) => {
      ready = null;
      throw err;
    });
  }
  return ready;
}

module.exports = { prepare };
