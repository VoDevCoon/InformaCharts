import childProcess from 'child_process';
import mongoose from 'mongoose';
import express from 'express';
import bodyParser from 'body-parser';
import moment from 'moment-timezone';
import path from 'path';
import _ from 'lodash';
import logger from './util/logger';
import eventRouter from './route/eventRoutes';
import orderRouter from './route/orderRoutes';
import config from './config/config';
import EventService from './services/eventService';
import OrderService from './services/orderService';
import Event from './data/eventModel';
import Order from './data/orderModel';

mongoose.connect(config.db.url, { useNewUrlParser: true });

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname));


app.use('/events', eventRouter);
app.use('/orders', orderRouter);

app.listen(config.port);
logger.log(`listen to: ${config.port}`);


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



// EventService.getAllEventsByStatus('enable').then(async (events) => {
//   const orders = [];
//   const startDate = moment().tz('Australia/Sydney').startOf('month').subtract(1, 'months');

//   for (let i = 0; i < 5; i += 1) {
//     // logger.log(events[i].name);
//     // let eventOrders = await OrderService.eventOrdersByDayOfWeek(events[i], startDate.unix() * 1000);
//     const eventOrders = await OrderService.eventOrdersByDayOfMonth(events[i], startDate.unix() * 1000);
//     orders.push(eventOrders);
//   }

//   logger.log(orders);
// }).catch(err => logger.log(err.message));
