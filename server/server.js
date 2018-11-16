import childProcess from 'child_process';
import mongoose from 'mongoose';
import express from 'express';
import bodyParser from 'body-parser';
import logger from './util/logger';
import eventRouter from './route/eventRoutes';
import orderRouter from './route/orderRoutes';
import config from './config/config';

mongoose.connect(config.db.url, { useNewUrlParser: true });

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname));


app.use('/events', eventRouter);
app.use('/orders', orderRouter);

app.listen(config.port);
logger.log(`listen to: ${config.port}`);


const worker = childProcess.fork(`${__dirname}/util/worker.js`);

worker.on('message', (msg) => {
  logger.log(msg);
});

worker.on('error', (err) => {
  logger.error(err);
});

worker.on('exit', () => {
  logger.log('child process exit');
});

worker.send('syncData');
worker.send('checkOrders');
