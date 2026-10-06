'use strict';
const mongoose = require('mongoose');
const tripScoped = require('./plugins/tripScoped');
const { str } = require('../utils/validate');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_AMOUNT = 1e12; // in minor units (paise / cents)

function isAmount(n) { return Number.isInteger(n) && n > 0 && n <= MAX_AMOUNT; }

// Expenses and settlements share one collection; `kind` tells them apart.
const expenseSchema = new mongoose.Schema({
  _id: String,
  kind: { type: String, enum: ['expense', 'settlement'], required: true },
  amount: { type: Number, required: true },
  date: { type: String, required: true },
  createdAt: Number,
  // expense only
  desc: String,
  paidBy: String,
  split: { type: String, enum: ['equal', 'exact'] },
  among: { type: [String], default: undefined },
  shares: { type: Map, of: Number },
  updatedAt: Number,
  // settlement only
  from: String,
  to: String
}, { collection: 'expenses', versionKey: false });

expenseSchema.plugin(tripScoped);

/**
 * Check an expense or settlement against the current member ids.
 * Returns { doc } on success or { error } with a message fit to show a person.
 */
expenseSchema.statics.check = function (body, memberIds) {
  const b = body || {};
  const has = (id) => memberIds.has(id);
  const date = DATE_RE.test(String(b.date)) ? String(b.date) : new Date().toISOString().slice(0, 10);
  const createdAt = Number(b.createdAt) || Date.now();

  if (b.kind === 'settlement') {
    if (!has(b.from) || !has(b.to)) return { error: 'That payment names someone who is not on the trip.' };
    if (b.from === b.to) return { error: 'A payment needs two different people.' };
    if (!isAmount(b.amount)) return { error: 'Enter an amount greater than zero.' };
    return { doc: { kind: 'settlement', from: b.from, to: b.to, amount: b.amount, date, createdAt } };
  }

  const desc = str(b.desc, 80);
  if (!desc) return { error: 'Add a short description.' };
  if (!isAmount(b.amount)) return { error: 'Enter an amount greater than zero.' };
  if (!has(b.paidBy)) return { error: 'Choose who paid.' };
  const split = b.split === 'exact' ? 'exact' : 'equal';

  const shares = {};
  let sum = 0;
  const raw = b.shares && typeof b.shares === 'object' ? b.shares : {};
  for (const [id, v] of Object.entries(raw)) {
    if (!has(id)) return { error: 'The split names someone who is not on the trip.' };
    if (!Number.isInteger(v) || v < 0) return { error: 'Each share must be a whole number of paise or cents.' };
    if (v > 0) { shares[id] = v; sum += v; }
  }
  if (!Object.keys(shares).length) return { error: 'Pick at least one person to split with.' };
  if (sum !== b.amount) return { error: 'The shares do not add up to the total.' };

  const among = Array.isArray(b.among) ? b.among.filter(has) : Object.keys(shares);

  return {
    doc: {
      kind: 'expense', desc, amount: b.amount, paidBy: b.paidBy, date, split, among, shares,
      createdAt, updatedAt: Date.now()
    }
  };
};

// memberId must already have passed isId, so it is safe to use in the `shares.<id>` path.
expenseSchema.statics.involving = function (tripId, memberId) {
  return this.exists({
    tripId,
    $or: [
      { paidBy: memberId },
      { from: memberId },
      { to: memberId },
      { among: memberId },
      { ['shares.' + memberId]: { $exists: true } }
    ]
  });
};

// Map of tripId -> { count, spent } over expenses (settlements are not spending).
expenseSchema.statics.totalsByTrip = async function () {
  const rows = await this.aggregate([
    { $match: { kind: 'expense' } },
    { $group: { _id: '$tripId', count: { $sum: 1 }, spent: { $sum: '$amount' } } }
  ]);
  return new Map(rows.map((r) => [r._id, r]));
};

module.exports = mongoose.model('Expense', expenseSchema);
