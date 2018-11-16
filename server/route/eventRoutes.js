import express from 'express';
import EventService from '../services/eventService';

const router = express.Router();

router.get('/:status', (req, res) => {
  EventService.getAllEventsByStatus(req.params.status)
    .then((events) => { res.json(events); })
    .catch((err) => { res.send(err); });
});

router.get('/:status/:pageIndex-:pageSize', (req, res) => {
  EventService.getEventsWithPaging(req.params.status, req.params.pageIndex, req.params.pageSize)
    .then((events) => { res.json(events); })
    .catch((err) => { res.send(err); });
});

module.exports = router;
