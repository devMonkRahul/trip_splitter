'use strict';

module.exports = function errorHandler(err, req, res, next) {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'The server hit a problem. Try again in a moment.' });
};
