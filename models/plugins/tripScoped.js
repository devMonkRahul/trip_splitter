'use strict';

// Members and expenses each belong to one trip. Their ids come from the page, so
// putInTrip refuses an id that is already used in another trip instead of moving
// that record across.
module.exports = function tripScoped(schema) {
  schema.add({ tripId: { type: String, required: true, index: true } });

  schema.statics.findInTrip = function (tripId) {
    return this.find({ tripId }, { tripId: 0 }).lean();
  };

  // Resolves to false when the id belongs to another trip.
  schema.statics.putInTrip = async function (tripId, id, doc) {
    try {
      await this.replaceOne({ _id: id, tripId }, { ...doc, tripId }, { upsert: true });
      return true;
    } catch (err) {
      if (err.code === 11000) return false;
      throw err;
    }
  };
};
