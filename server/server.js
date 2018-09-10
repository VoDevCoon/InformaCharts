import childProcess from 'child_process';
import logger from './util/logger';
import mongoose from 'mongoose';
import moment from 'moment-timezone';
import config from './config/config';
import EventService from './services/eventService';
import OrderService from './services/orderService';
import Event from './data/eventModel';

// const worker = childProcess.fork(`${__dirname}/util/worker.js`);

// worker.on('message', (msg) => {
//   logger.log(msg);
// });

// worker.on('error', (err) => {
//   logger.error(err);
// });

// worker.on('exit', () => {
//   logger.log('child process exit');
// });

// worker.send('syncData');
// worker.send('checkOrders');

const db = mongoose.connect(config.db.url, { useNewUrlParser: true });


  Event.find({})
  .then(result => logger.log(result))
  .catch(err => logger.error(err));

// EventService.getAllEventsByStatus('enable').then(async events => {
//   const orders = [];
//   const startDate = moment().tz('Australia/Sydney').startOf('isoWeek').subtract(10, 'weeks');
//   const endDate = moment().tz('Australia/Sydney').endOf('isoWeek').subtract(1, 'weeks');

//   logger.log(startDate);
//   logger.log(endDate);

//   for (let i = 0; i < events.length; i += 1) {
//     // logger.log(events[i].name);
//     let eventOrders = await OrderService.findEventOrdersByDateRange(events[i]._id, startDate, endDate);

//     logger.log(eventOrders);
//     if (eventOrders && eventOrders.length > 0) {
//       logger.log(events[i].name);
//       logger.log(eventOrders);
//     }
//   }
// }).catch(err => logger.log(err.message));
