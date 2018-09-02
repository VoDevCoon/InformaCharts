import mongoose from 'mongoose';
import moment from 'moment-timezone';
import chalk from 'chalk';
import seed from './seed';
import config from '../config/config';
import logger from './logger';

const syncData = function () {
  mongoose.connect(config.db.url, { useNewUrlParser: true });

  const ts = moment.tz('Australia/Sydney').format('YYYY-MM-D hh:mm:ss');
  process.send(chalk.yellow(`>> start syncing data in the child process | ${ts}`));

  seed.syncEvents().then(async (syncEventResult) => {
    process.send(`Events added: ${syncEventResult.nUpserted} | Event(s) modified: ${syncEventResult.nModified}`);
    seed.syncOrders(3)
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

const runTask = function (msg) {
  switch (msg) {
    case 'syncData':
      syncData(); // run task immediately
      setInterval(() => { syncData(); }, config.workerTaskInterval.syncData);
      break;
    case 'test': {
      setInterval(() => { process.send('child process test message'); }, config.workerTaskInterval.syncData);
      break;
    }
    default: break;
  }
};

process.on('message', (msg) => {
  runTask(msg);
});
