import mongoose from 'mongoose';
import moment from 'moment-timezone';
import chalk from 'chalk';
import seed from './seed';
import config from '../config/config';
import logger from './logger';

mongoose.connect(config.db.url, { useNewUrlParser: true });

const syncData = function () {
  // mongoose.connect(config.db.url, { useNewUrlParser: true });

  const ts = moment.tz('Australia/Sydney').format('YYYY-MM-D hh:mm:ss');
  process.send(chalk.yellow(`>> start syncing data in the child process | ${ts}`));

  seed.syncEvents().then(async (syncEventResult) => {
    process.send(`Events added: ${syncEventResult.nUpserted} | Event(s) modified: ${syncEventResult.nModified}`);

    seed.syncOrders(config.syncOrderBatches)
      .then((syncOrderResult) => {
        let totalInserted = 0;
        if (syncOrderResult && syncOrderResult.length > 0) {
          syncOrderResult.forEach((result) => {
            totalInserted += result.nInserted;
          });
        }
        process.send(`Orders added: ${totalInserted}`);
      }).catch(err => logger.error(err));
  }).catch(err => logger.error(err));
};

const checkNoProfitOrders = function () {
  // mongoose.connect(config.db.url, { useNewUrlParser: true });

  seed.checkNoProfitOrders('failed')
    .then((checkFailedOrderResult) => {
      if (checkFailedOrderResult) process.send(`failed orders updated: ${checkFailedOrderResult.nModified}`);

      seed.checkNoProfitOrders('cancelled')
        .then((checkCancelledOrderResult) => {
          if (checkCancelledOrderResult) process.send(`cancelled orders updated: ${checkCancelledOrderResult.nModified}`);
        })
        .catch(err => process.send(`Error on checking no-profit orders: ${err}`));
    })
    .catch(err => process.send(`Error on checking no-profit orders: ${err}`));
};

const runTask = function (msg) {
  switch (msg) {
    case 'syncData':
      syncData(); // run task immediately
      setInterval(() => { syncData(); }, config.workerTaskInterval.syncData);
      break;
    case 'checkOrders':
      // checkNoProfitOrders();
      setInterval(() => { checkNoProfitOrders(); }, config.workerTaskInterval.syncData * 3);
      break;
    case 'test':
      setInterval(() => { process.send('child process test message'); }, config.workerTaskInterval.syncData);
      break;
    default: break;
  }
};

process.on('message', (msg) => {
  runTask(msg);
});
