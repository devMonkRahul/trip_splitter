'use strict';
const Member = require('../models/Member');
const Expense = require('../models/Expense');
const { bad } = require('../utils/http');

exports.put = async (req, res) => {
  const { tripId, id } = req.params;
  const memberIds = new Set(await Member.distinct('_id', { tripId }));
  const v = Expense.check(req.body, memberIds);
  if (v.error) return bad(res, v.error);
  if (!(await Expense.putInTrip(tripId, id, v.doc))) return bad(res, 'That id is already in use.', 409);
  res.status(204).end();
};

exports.remove = async (req, res) => {
  const { tripId, id } = req.params;
  await Expense.deleteOne({ _id: id, tripId });
  res.status(204).end();
};
