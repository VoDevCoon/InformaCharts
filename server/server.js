import mongoose from 'mongoose';
import seed from './util/seed';
import config from './config/config';
import logger from './util/logger';


mongoose.connect(config.db.url, { useNewUrlParser: true });
seed.newEvents();
