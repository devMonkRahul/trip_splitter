'use strict';
const mongoose = require('mongoose');
const { str } = require('../utils/validate');

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'THB', 'SGD'];

const tripSchema = new mongoose.Schema({
  _id: String,
  name: { type: String, default: '', maxlength: 80 },
  currency: { type: String, enum: CURRENCIES, default: 'INR' },
  createdAt: Number
}, { collection: 'trips', versionKey: false });

tripSchema.statics.clean = function (body) {
  const b = body || {};
  return {
    name: str(b.name, 80),
    currency: CURRENCIES.includes(b.currency) ? b.currency : 'INR'
  };
};

// Creates the trip on its first save; later saves change only the name and currency.
tripSchema.statics.saveSettings = function (id, body) {
  return this.updateOne(
    { _id: id },
    { $set: this.clean(body), $setOnInsert: { createdAt: Date.now() } },
    { upsert: true }
  );
};

module.exports = mongoose.model('Trip', tripSchema);
