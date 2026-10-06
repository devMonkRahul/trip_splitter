'use strict';
const Trip = require('../models/Trip');
const Member = require('../models/Member');
const Expense = require('../models/Expense');

// The page works with `id`; MongoDB stores it as `_id`.
const withId = ({ _id, ...rest }) => ({ id: _id, ...rest });

exports.list = async (req, res) => {
  const [trips, people, totals] = await Promise.all([
    Trip.find().sort({ createdAt: -1 }).lean(),
    Member.countByTrip(),
    Expense.totalsByTrip()
  ]);
  res.set('Cache-Control', 'no-store');
  res.json({
    trips: trips.map((t) => ({
      ...withId(t),
      people: people.get(t._id) || 0,
      expenses: totals.get(t._id)?.count || 0,
      spent: totals.get(t._id)?.spent || 0
    }))
  });
};

exports.show = async (req, res) => {
  const { trip } = req;
  const [members, expenses] = await Promise.all([
    Member.findInTrip(trip._id),
    Expense.findInTrip(trip._id)
  ]);
  res.set('Cache-Control', 'no-store');
  res.json({ trip: withId(trip), members: members.map(withId), expenses: expenses.map(withId) });
};

exports.put = async (req, res) => {
  await Trip.saveSettings(req.params.tripId, req.body);
  res.status(204).end();
};

// The trip goes last, so if this fails part-way the trip is still listed and can be deleted again.
exports.remove = async (req, res) => {
  const { tripId } = req.params;
  await Promise.all([Member.deleteMany({ tripId }), Expense.deleteMany({ tripId })]);
  await Trip.deleteOne({ _id: tripId });
  res.status(204).end();
};
