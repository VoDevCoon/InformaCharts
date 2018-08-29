import mongoose from 'mongoose';
import seed from './util/seed';
import config from './config/config';
import logger from './util/logger';

mongoose.connect(config.db.url, { useNewUrlParser: true });

// seed.syncEvents().then(async (syncEventResult) => {
//   logger.log(syncEventResult);
//   seed.syncOrders().then(syncOrderResult => logger.log(syncOrderResult)).catch(err => logger.error(err));
// }).catch(err => logger.error(err));

seed.syncOrders()
  .then(syncOrderResult => logger.log(syncOrderResult))
  .catch(err => logger.error(err));
