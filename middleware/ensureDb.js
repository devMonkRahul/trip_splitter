'use strict';
const { prepare } = require('../utils/setup');

// Holds each API request until the database is connected and prepared.
module.exports = function ensureDb(req, res, next) {
  prepare().then(() => next(), next);
};
