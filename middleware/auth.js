'use strict';
const crypto = require('crypto');
const { accessCode } = require('../config');

function codeMatches(given) {
  const a = Buffer.from(String(given || ''));
  const b = Buffer.from(accessCode);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = function auth(req, res, next) {
  if (!accessCode || codeMatches(req.get('x-access-code'))) return next();
  res.status(401).json({ error: 'Enter the trip code to continue.' });
};
