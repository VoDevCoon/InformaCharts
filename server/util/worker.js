import mongoose from 'mongoose';
import seed from './util/seed';
import config from './config/config';
import logger from './util/logger';


process.on('message', runTask(msg));

const syncData = function () {
  mongoose.connect(config.db.url, { useNewUrlParser: true });

  seed.syncEvents().then(async (syncEventResult) => {
    logger.log(`Events added: ${syncEventResult.nUpserted} | Event(s) modified: ${syncEventResult.nModified}`);
    seed.syncOrders()
      .then((syncOrderResult) => {
        let totalInserted = 0;
        if (syncOrderResult && syncOrderResult.length > 0) {
          syncOrderResult.forEach((result) => {
            totalInserted += result.nInserted;
          });
        }
        logger.log(`Orders added: ${totalInserted}`);
      }).catch(err => logger.error(err));
  }).catch(err => logger.error(err));
};

const runTask = function (msg) {
  switch (msg) {
    case 'syncData':
      setInterval(() => { syncData() }, config.workerTaskInterval.syncData);
      break;
    case 'test':
      let i = 0;
      setInterval(() => {logger.log(`child process test message | ${i+=1}`)}, config.workerTaskInterval.syncData);
    default:
      break;
  }
};
