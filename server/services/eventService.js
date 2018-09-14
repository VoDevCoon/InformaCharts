import mongoose from 'mongoose';
import config from '../config/config';
import Event from '../data/eventModel';
import logger from '../util/logger';

const EventService = {
  getAllEventsByStatus: async status => new Promise((resolve, reject) => {
    Event.find({ status }).sort({ name: 1 })
      .then((events) => { logger.log(events.length); resolve(events); })
      .catch(err => reject(err));
  }),
};

module.exports = EventService;
