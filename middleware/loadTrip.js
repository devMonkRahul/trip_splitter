'use strict';
const Trip = require('../models/Trip');
const { bad } = require('../utils/http');

// For routes inside a trip: answers 404 if the trip is gone, otherwise sets req.trip.
module.exports = async function loadTrip(req, res, next) {
  try {
    const trip = await Trip.findById(req.params.tripId).lean();
    if (!trip) return bad(res, 'This trip no longer exists.', 404);
    req.trip = trip;
    next();
  } catch (err) {
    next(err);
  }
};
