'use strict';
require('dotenv').config();
const config = require('./config');
const db = require('./config/db');
const app = require('./app');
const { prepare } = require('./utils/setup');

// For `npm start` and long-running hosts. On Vercel, app.js is the entry point and
// connects on the first request instead.
(async () => {
  const conn = await prepare();
  const server = app.listen(config.port, () => {
    console.log(`Trip splitter on http://localhost:${config.port} (storage: MongoDB "${conn.name}"${config.accessCode ? ', trip code on' : ''})`);
  });
  const stop = () => server.close(() => db.disconnect().finally(() => process.exit(0)));
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
})().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
