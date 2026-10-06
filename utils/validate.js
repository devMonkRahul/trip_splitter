'use strict';

const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

function isId(id) { return typeof id === 'string' && ID_RE.test(id); }
function str(v, max) { return String(v == null ? '' : v).trim().slice(0, max); }

module.exports = { isId, str };
