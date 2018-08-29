import WooCommerceAPI from 'woocommerce-api';
import _ from 'lodash';
import moment from 'moment-timezone';
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

const getDate = yyyymmdd => Date.parse(`${yyyymmdd.substring(0, 4)}-${yyyymmdd.substring(4, 6)}-${yyyymmdd.substring(6, 8)}`);

const searchEvents = async (wooCommerce, createdDate, pageIndex, pageSize) => new Promise((resolve, reject) => {
  const evts = [];
  const query = `products/?status=publish&after=${createdDate}&per_page=${pageSize}&page=${pageIndex}&orderby=date&order=desc`;

  // logger.log(`serching newly added events:\nqueryURL=${query}`);
  // process.stdout.write('.');

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
          createdDate: Date.parse(`${c.date_created_gmt}Z`), // save date to mongodb in UTC
        };

        if (_.includes(event.categories, 'Conferences')) {
          evts.push(event);
        }
      });

      if (events.length === pageSize) {
        const nextPage = pageIndex + 1;
        searchEvents(wooCommerce, createdDate, nextPage, pageSize)
          .then(results => resolve([...evts, ...results])); // merge the results to evts and resolve to up-level recursive call
      } else {
        // logger.log('reaching last page for newly added events.');
        resolve(evts);
      }
    } else {
      logger.log(result);
      reject(result);
    }
  });
});

const searchOrders = async (wooCommerce, event, createdDate, pageIndex, pageSize) => new Promise((resolve, reject) => {
  const ods = [];
  const query = `orders?product=${event.eventId}&per_page=${pageSize}&page=${pageIndex}&after=${createdDate}&orderby=date&order=desc`;

  // logger.log(`\n** PAGE ${pageIndex} [Orders] <${event.name}>**\n`);
  // logger.log(query);
  // process.stdout.write('.');

  wooCommerce.getAsync(query).then((result) => {
    if (result.statusCode === 200 && result.body.length > 0) {
      const orders = JSON.parse(result.body);
      orders.forEach((o) => {
        const order = {
          orderId: o.id,
          status: o.status,
          currency: o.currency,
          total: o.total,
          createdDate: Date.parse(`${o.date_created_gmt}Z`), // save date to mongodb in UTC
          event: event._id,
        };

        ods.push(order);
      });

      if (orders.length === pageSize) {
        const nextPage = pageIndex + 1;
        searchOrders(wooCommerce, event, createdDate, nextPage, pageSize)
          .then(results => resolve([...ods, ...results]));
      } else {
        // logger.log(`reaching last page for <${event.name}>'s new orders.`);
        resolve(ods);
      }
    } else {
      logger.log(result);
      reject(result);
    }
  });
});

const searchNewEventOrders = async event => new Promise((resolve, reject) => {
  Order.findOne({ event: event._id })
    .sort({ createdDate: -1 })
    .exec()
    .then((result) => {
      let createdDateString = config.defaultSearchStartDate.order;
      if (result) {
        // search remote using local timestamp as it's saved in locIal time in woocommerce
        const createdDate = moment(result.createdDate.toISOString());
        createdDateString = createdDate.tz('Australia/Sydney').format('YYYY-MM-DDTHH:mm:ss');
      }
      // search remote woocommerce orders added after the local latest order
      searchOrders(wooCommerceAPI, event, createdDateString, 1, 100)
        .then((orders) => {
          // logger.log(`orders of <${event.name}> found: ${orders.length}`);
          resolve(orders);
        }).catch(err => reject(err.message));
    });
});

const addEventOrders = async event => new Promise((resolve, reject) => {
  searchNewEventOrders(event)
    .then((orders) => {
      logger.log(`found: ${orders.length}`);

      if (orders && orders.length > 0) {
        const bulkop = Order.collection.initializeUnorderedBulkOp();
        orders.forEach(async (order) => {
          bulkop.insert(order);
        });

        bulkop.execute()
          .then(result => resolve(result))
          .catch(err => reject(err.message));
      } else {
        resolve();
      }
    });
});

const seed = {
  syncEvents: async () => new Promise((resolve, reject) => {
    logger.log('>> syncing events');

    const createdDateString = config.defaultSearchStartDate.event;
    searchEvents(wooCommerceAPI, createdDateString, 1, 100).then((events) => {
      const bulkop = Event.collection.initializeUnorderedBulkOp();
      events.forEach((event) => {
        bulkop.find({ eventId: event.eventId }).upsert().updateOne(event);
      });

      bulkop.execute().then(result => resolve(result)).catch(err => reject(err.message));
    });
  }),

  syncOrders: async () => new Promise((resolve) => {
    Event.find({}).then(async (events) => {
      const results = [];

      for (let i = 0; i < events.length; i += 1) {
        logger.log(`>> searching orders for event <${events[i].name}>`);

        const result = await addEventOrders(events[i]);
        if (result) {
          results.push(result);
        }
      }

      resolve(results);
    });
  }),
};

module.exports = seed;
