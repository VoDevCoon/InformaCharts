import express from 'express';
import EventService from '../services/eventService';
import logger from '../util/logger';

const router = express.Router();

router.get('/events', (req, res) => {
  logger.log(res.params);
  EventService.getAllEventsByStatus(req.params.status)
    .then((events) => { res.send(events); })
    .catch((err) => { res.send(err); });
});

module.exports = router;
