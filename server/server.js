import childProcess from 'child_process';
import logger from './util/logger';

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
