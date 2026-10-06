'use strict';
const Member = require('../models/Member');
const Expense = require('../models/Expense');
const { bad } = require('../utils/http');

exports.put = async (req, res) => {
  const { tripId, id } = req.params;
  const m = Member.clean(req.body);
  if (!m.name) return bad(res, 'Add a name.');
  if (await Member.nameTaken(tripId, m.name, id)) return bad(res, `${m.name} is already on the trip.`, 409);
  if (!(await Member.putInTrip(tripId, id, m))) return bad(res, 'That id is already in use.', 409);
  res.status(204).end();
};

exports.remove = async (req, res) => {
  const { tripId, id } = req.params;
  const m = await Member.findOne({ _id: id, tripId }).lean();
  if (m && (await Expense.involving(tripId, id))) {
    return bad(res, `${m.name} is part of an expense, so they can't be removed.`, 409);
  }
  await Member.deleteOne({ _id: id, tripId });
  res.status(204).end();
};
