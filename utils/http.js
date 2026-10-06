'use strict';

// Express 4 does not catch rejected promises, so async handlers pass their errors on through this.
const wrap = (fn) => (req, res, next) => fn(req, res).catch(next);
const bad = (res, msg, status = 400) => res.status(status).json({ error: msg });

module.exports = { wrap, bad };
