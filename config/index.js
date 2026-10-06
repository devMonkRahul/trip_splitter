'use strict';

module.exports = {
  port: Number(process.env.PORT) || 3000,
  accessCode: process.env.ACCESS_CODE || '',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/trip_splitter'
};
