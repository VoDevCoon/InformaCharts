import express from 'express';
import Event from '../data/eventModel';
import OrderService from '../services/orderService';
import logger from '../util/logger';

const router = express.Router();

router.param('eventCode', (req, res, next, eventCode) => {
  Event.findOne({ eventCode })
    .then((result) => {
      if (result) {
        req.event = result;
        next();
      } else {
        next(new Error('No event is found with supplied eventId'));
      }
    });
});

router.get('/:eventCode/:range/:startDate', (req, res) => {
  if (req.params.range === 'week') {
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

router.post('/:range/:startDate', async (req, res) => {
  const events = req.body.events;
  if (events && events.length > 0) {
    const orders = [];
    try {
      for (let i = 0; i < events.length; i += 1) {
        let event = await Event.findOne({ eventCode: events[i] });
        if (event) {
          let eventOrders = {};
          if (req.params.range === 'week') {
            eventOrders = await OrderService.eventOrdersByDayOfWeek(event, req.params.startDate);
          } else if (req.params.range === 'month') {
            eventOrders = await OrderService.eventOrdersByDayOfMonth(event, req.params.startDate);
          }

          orders.push(eventOrders);
        }
      }
      res.json(orders);
    } catch (err) {
      res.send(err);
    }
  }
});

module.exports = router;
