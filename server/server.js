import mongoose from 'mongoose';
import _ from 'lodash';
import seed from './util/seed';
import config from './config/config';
import Event from './data/eventModel';
import Order from './data/orderModel';
import logger from './util/logger';

mongoose.connect(config.db.url, { useNewUrlParser: true });

setInterval(() => {
  seed.newEvents();
}, 10000);

Event.find({}).sort({ createdDate: -1 }).exec().then((result) => {
  if (result && result.length > 0) {
    result.forEach((event) => {
      seed.newEventOrders(event);
    });
  }
});

// Event.findOne({ eventId: '32593' }).exec().then((result) => {
//   const event = result;
//   Order.aggregate([
//     { $match: { event: result._id } },
//     { $group: { _id: '$event', revenue: { $sum: '$total' } } },
//   ]).exec().then((result) => {
//     logger.log(_.merge({ eventId: event.eventId, name: event.name }, result));
//   });
// });
