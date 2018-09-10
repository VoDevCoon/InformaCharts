import mongoose from 'mongoose';
import config from '../config/config';
import Event from '../data/eventModel';

const EventService = {
  getAllEventsByStatus: async (status) => new Promise((resolve, reject) => {
    Event.find({status: status}).sort({name: 1})
      .then(events => resolve(events))
      .catch(err => reject(err));
  }),
};

module.exports = EventService;
