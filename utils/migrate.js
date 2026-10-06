'use strict';
const mongoose = require('mongoose');
const Trip = require('../models/Trip');
const Member = require('../models/Member');
const Expense = require('../models/Expense');

const FIRST_TRIP_ID = 'first-trip';

// Before the app had several trips, the one trip's name and currency sat in the
// `meta` collection under the id "trip", and members and expenses had no tripId.
// This moves that data into a trip of its own. It does nothing once that is done.
module.exports = async function migrateSingleTrip() {
  const metaColl = mongoose.connection.db.collection('meta');
  const meta = await metaColl.findOne({ _id: 'trip' });
  const orphaned = { tripId: { $exists: false } };
  const [people, expenses] = await Promise.all([
    Member.countDocuments(orphaned),
    Expense.countDocuments(orphaned)
  ]);
  if (!meta && !people && !expenses) return;

  await Trip.updateOne(
    { _id: FIRST_TRIP_ID },
    { $setOnInsert: { ...Trip.clean(meta), createdAt: Date.now() } },
    { upsert: true }
  );
  await Member.updateMany(orphaned, { $set: { tripId: FIRST_TRIP_ID } });
  await Expense.updateMany(orphaned, { $set: { tripId: FIRST_TRIP_ID } });
  if (meta) await metaColl.deleteOne({ _id: 'trip' });
  console.log(`Moved the existing trip (${people} people, ${expenses} expenses) into the trips list.`);
};
