'use strict';
const express = require('express');
const auth = require('../middleware/auth');
const loadTrip = require('../middleware/loadTrip');
const { isId } = require('../utils/validate');
const { wrap, bad } = require('../utils/http');
const trips = require('../controllers/tripController');
const members = require('../controllers/memberController');
const expenses = require('../controllers/expenseController');

const router = express.Router();
const checkId = (req, res, next, id) => (isId(id) ? next() : bad(res, 'Invalid id.'));

router.use(auth);
router.param('tripId', checkId);
router.param('id', checkId);

router.get('/trips', wrap(trips.list));
router.put('/trips/:tripId', wrap(trips.put));
router.delete('/trips/:tripId', wrap(trips.remove));
router.get('/trips/:tripId', loadTrip, wrap(trips.show));

router.put('/trips/:tripId/members/:id', loadTrip, wrap(members.put));
router.delete('/trips/:tripId/members/:id', loadTrip, wrap(members.remove));
router.put('/trips/:tripId/expenses/:id', loadTrip, wrap(expenses.put));
router.delete('/trips/:tripId/expenses/:id', loadTrip, wrap(expenses.remove));

router.use((req, res) => bad(res, 'Not found.', 404));

module.exports = router;
