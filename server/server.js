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

worker.send('checkOrders');

// mongoose.connect(config.db.url, { useNewUrlParser: true });

// seed.syncEvents().then(async (syncEventResult) => {
//   logger.log(`Events added: ${syncEventResult.nUpserted} | Event(s) modified: ${syncEventResult.nModified}`);
//   seed.syncOrders()
//     .then((syncOrderResult) => {
//       let totalInserted = 0;
//       if (syncOrderResult && syncOrderResult.length > 0) {
//         syncOrderResult.forEach((result) => {
//           totalInserted += result.nInserted;
//         });
//       }
//       logger.log(`Orders added: ${totalInserted}`);
//     }).catch(err => logger.error(err));
// }).catch(err => logger.error(err));
