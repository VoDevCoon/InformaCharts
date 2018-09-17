import Event from '../data/eventModel';

const EventService = {
  getAllEventsByStatus: async status => new Promise((resolve, reject) => {
    Event.find({ status }).sort({ name: 1 })
      .then(events => resolve(events))
      .catch(err => reject(err));
  }),

  getEventsWithPaging: async (status, pageIndex, pageSize) => new Promise((resolve, reject) => {
    Event.find({ status }).sort({ name: 1 })
      .skip(~~pageIndex * ~~pageSize)
      .limit(~~pageSize)
      .then(events => resolve(events))
      .catch(err => reject(err));
  }),
};

module.exports = EventService;
