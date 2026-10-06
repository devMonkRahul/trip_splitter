'use strict';
const mongoose = require('mongoose');

// Atlas connection strings usually leave out the database name, and the driver would then use "test".
const DEFAULT_DB = 'trip_splitter';

async function connect(uri) {
  const named = /^mongodb(\+srv)?:\/\/[^/]+\/[^?]+/.test(uri);
  await mongoose.connect(uri, {
    dbName: named ? undefined : DEFAULT_DB,
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 10000
  });
  return mongoose.connection;
}

function disconnect() {
  return mongoose.disconnect();
}

module.exports = { connect, disconnect };
