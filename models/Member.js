'use strict';
const mongoose = require('mongoose');
const tripScoped = require('./plugins/tripScoped');
const { str } = require('../utils/validate');

const memberSchema = new mongoose.Schema({
  _id: String,
  name: { type: String, required: true, maxlength: 40 },
  createdAt: Number
}, { collection: 'members', versionKey: false });

memberSchema.plugin(tripScoped);

memberSchema.statics.clean = function (body) {
  const b = body || {};
  return {
    name: str(b.name, 40).replace(/\s+/g, ' '),
    createdAt: Number(b.createdAt) || Date.now()
  };
};

// Collation strength 2 ignores case, so "rahul" counts as the same name as "Rahul".
memberSchema.statics.nameTaken = function (tripId, name, exceptId) {
  return this.exists({ tripId, _id: { $ne: exceptId }, name }).collation({ locale: 'en', strength: 2 });
};

// Map of tripId -> number of people.
memberSchema.statics.countByTrip = async function () {
  const rows = await this.aggregate([{ $group: { _id: '$tripId', people: { $sum: 1 } } }]);
  return new Map(rows.map((r) => [r._id, r.people]));
};

module.exports = mongoose.model('Member', memberSchema);
