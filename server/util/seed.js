import WooCommerceAPI from 'woocommerce-api';
import _ from 'lodash';
import Event from '../data/eventModel';
import Order from '../data/orderModel';
import config from '../config/config';
import logger from './logger';

const wooCommerceAPI = new WooCommerceAPI({
  url: config.woo.baseUrl,
  consumerKey: config.woo.key,
  consumerSecret: config.woo.secret,
  wpAPI: true,
  version: 'wc/v2',
});

const onInsert = (err, docs) => {
  if (err) {
    logger.error(err.message);
  } else if (docs.length > 0) {
    logger.log(`${docs.length} items were successfully stored!`);
  } else {
    logger.log('no new item found.');
  }
};

const getDate = yyyymmdd => Date.parse(`${yyyymmdd.substring(0, 4)}-${yyyymmdd.substring(4, 6)}-${yyyymmdd.substring(6, 8)}`);

const searchNewEvents = (wooCommerce, createdDate, pageIndex, pageSize) => {
  const evts = [];
  const query = `products/?per_page=${pageSize}&page=${pageIndex}&after=${createdDate}&orderby=date&order=desc`;

  logger.log(`serching newly added events:\nqueryURL=${query}`);

  wooCommerce.getAsync(query).then((result) => {
    if (result.statusCode === 200 && result.body.length > 0) {
      const events = JSON.parse(result.body);

      events.forEach((c) => {
        const event = {
          eventId: c.id,
          name: c.name,
          eventCode: _.filter(c.meta_data, { key: 'event_code' })[0].value,
          categories: _.map(c.categories, 'name'),
          status: _.filter(c.meta_data, { key: 'event_status' })[0].value,
          startDate: _.filter(c.meta_data, { key: 'starts' })[0].value
            ? getDate(_.filter(c.meta_data, { key: 'starts' })[0].value)
            : new Date('2001-01-01'),
          duration: _.filter(c.meta_data, { key: 'duration' })[0].value,
          createdDate: Date.parse(c.date_created),
        };

        if (_.includes(event.categories, 'Conferences')) {
          evts.push(event);
        }
      });

      Event.insertMany(evts, onInsert);

      if (events.length === pageSize) {
        const nextPage = pageIndex + 1;
        searchNewEvents(wooCommerce, createdDate, nextPage, pageSize);
      } else {
        logger.log('reaching last page for newly added events.');
      }
    } else {
      logger.log(result);
    }
  });
};

const searchNewOrders = (wooCommerce, event, createdDate, pageIndex, pageSize) => {
  const ods = [];
  const query = `orders?product=${event.eventId}&per_page=${pageSize}&page=${pageIndex}&after=${createdDate}&orderby=date&order=desc`;

  logger.log(`\n** PAGE ${pageIndex} <${event.name}>**`);

  wooCommerce.getAsync(query).then((result) => {

    if (result.statusCode === 200 && result.body.length > 0) {
      const orders = JSON.parse(result.body);
      orders.forEach((o) => {
        const order = {
          orderId: o.id,
          status: o.status,
          currency: o.currency,
          total: o.total,
          createdDate: Date.parse(o.date_created),
          event: event._id,
        };

        ods.push(order);
      });

      Order.insertMany(ods, onInsert);

      if (orders.length === pageSize) {
        const nextPage = pageIndex + 1;
        searchNewOrders(wooCommerce, event, createdDate, nextPage, pageSize);
      } else {
        logger.log(`reaching last page for <${event.name}>'s new orders.`);
      }
    } else {
      logger.log(result);
    }
  });
};

const seed = {
  newEvents: () => {
    Event.findOne({}).sort({ createdDate: -1 }).exec().then((result) => {
      let createdDate = '2018-01-10T00:00:00';
      if (result) {
        createdDate = result.createdDate.toISOString();
      }

      searchNewEvents(wooCommerceAPI, createdDate, 1, 50);
    });
  },

  newEventOrders: (event) => {
    //get latest event order from local db
    Order.findOne({ event: event._id }).sort({ createdDate: -1 }).exec().then((result) => {
      let createdDate = '2018-01-10T00:00:00';
      if (result) {
        createdDate = result.createdDate.toISOString();
      }
      //search remote woocommerce orders added after the local latest order
      searchNewOrders(wooCommerceAPI, event, createdDate, 1, 5);
    });
  },
};

module.exports = seed;
