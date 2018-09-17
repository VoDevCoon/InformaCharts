import express from 'express';
import Event from '../data/eventModel';
import OrderService from '../services/orderService';
import logger from '../util/logger';

const router = express.Router();

router.param('eventId', (req, res, next, eventId) => {
  Event.findOne({ _id: eventId })
    .then((result) => {
      if (result) {
        req.event = result;
        next();
      } else {
        next(new Error('No event is found with supplied eventId'));
      }
    })
});

router.get('/:eventId/:range/:startDate', (req, res) => {
  if (req.params.range === 'week') {
    logger.log('in week');
    OrderService.eventOrdersByDayOfWeek(req.event, req.params.startDate)
      .then((orders) => { res.json(orders); })
      .catch((err) => { res.send(err); });
  } else if (req.params.range === 'month') {
    OrderService.eventOrdersByDayOfMonth(req.event, req.params.startDate)
      .then((orders) => { res.json(orders); })
      .catch((err) => { res.send(err); });
  } else {
    res.send('No range specified');
  }
});

module.exports = router;
