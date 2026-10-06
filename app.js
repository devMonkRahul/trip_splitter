'use strict';
const path = require('path');
const express = require('express');
const apiRoutes = require('./routes/api');
const ensureDb = require('./middleware/ensureDb');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '64kb' }));

app.get('/healthz', (req, res) => res.type('text').send('ok'));
app.use('/api', ensureDb, apiRoutes);

// The view: one static page that loads trips from /api. On Vercel the CDN serves public/ and this is skipped.
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

app.use(errorHandler);

module.exports = app;
