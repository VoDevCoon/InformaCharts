import childProcess from 'child_process';
import logger from './util/logger';
import mongoose from 'mongoose';
import moment from 'moment-timezone';
import _ from 'lodash';
import config from './config/config';
import EventService from './services/eventService';
import OrderService from './services/orderService';
import Event from './data/eventModel';
import Order from './data/orderModel';


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

mongoose.connect(config.db.url, { useNewUrlParser: true });

EventService.getAllEventsByStatus('enable').then(async events => {
  const orders = [];
  const startDate = moment().tz('Australia/Sydney').startOf('month').subtract(1, 'months');

  for (let i = 0; i < 5; i += 1) {
    // logger.log(events[i].name);
    //let eventOrders = await OrderService.eventOrdersByDayOfWeek(events[i], startDate.unix() * 1000);
    let eventOrders = await OrderService.eventOrdersByDayOfMonth(events[i], startDate.unix() * 1000);
    orders.push(eventOrders);
  }

  logger.log(orders);
}).catch (err => logger.log(err.message));
