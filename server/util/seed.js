import WooCommerceAPI from 'woocommerce-api';
import _ from 'lodash';
import moment from 'moment-timezone';
import Event from '../data/eventModel';
import Order from '../data/orderModel';
import config from '../config/config';
import logger from './logger';
import { rejects } from 'assert';
import { resolveObject } from 'url';

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
    // logger.log(`${docs.length} items were successfully stored!`);
  } else {
    logger.log('no new item found.');
  }
};

const getDate = yyyymmdd => Date.parse(`${yyyymmdd.substring(0, 4)}-${yyyymmdd.substring(4, 6)}-${yyyymmdd.substring(6, 8)}`);

const searchNewEvents = async (wooCommerce, createdDate, pageIndex, pageSize) => {
  return new Promise((resolve, reject) => {

    const evts = [];
    const query = `products/?status=publish&after=${createdDate}&per_page=${pageSize}&page=${pageIndex}&orderby=date&order=desc`;

    // logger.log(`serching newly added events:\nqueryURL=${query}`);

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

        // try {
        //   Event.insertMany(evts, onInsert);
        //   logger.log(`${evts.length} items were successfully stored!`);
        // } catch (err) {
        //   reject(err.message);
        // }

        if (events.length === pageSize) {
          const nextPage = pageIndex + 1;
          searchNewEvents(wooCommerce, createdDate, nextPage, pageSize).then((result) => resolve([...evts, ...result])); // merge the results to evts and resolve to up-level recursive call
        } else {
          logger.log('reaching last page for newly added events.');
          resolve(evts);
        }
      } else {
        logger.log(result);
      }
    });
  });
};

const searchNewOrders = async (wooCommerce, event, createdDate, pageIndex, pageSize) => {
  return new Promise((resolve, reject) => {
    const ods = [];
    const query = `orders?product=${event.eventId}&per_page=${pageSize}&page=${pageIndex}&after=${createdDate}&orderby=date&order=desc`;

    logger.log(`\n** PAGE ${pageIndex} [Orders] <${event.name}>**\n`);
    // logger.log(query);

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

        // try {
        //   Order.insertMany(ods, onInsert);
        //   logger.log(`${ods.length} items were successfully stored!`);
        // } catch (err) {
        //   reject(err.message);
        // }

        if (orders.length === pageSize) {
          const nextPage = pageIndex + 1;
          searchNewOrders(wooCommerce, event, createdDate, nextPage, pageSize).then((orders) => resolve([...ods, ...orders]));
        } else {
          logger.log(`reaching last page for <${event.name}>'s new orders.`);
          resolve(ods);
        }
      } else {
        logger.log(result);
      }
    });
  });
};

const seed = {
  newEvents: async () => {
    return new Promise((resolve) => {
      Event.findOne({}).sort({ createdDate: -1 }).exec().then((result) => {
        let createdDateString = '2018-01-10T00:00:00';
        if (result) {
          // search remote using local timestamp as it's saved in locIal time in woocommerce
          const createdDate = moment(result.createdDate.toISOString());
          createdDateString = createdDate.tz('Australia/Sydney').format('YYYY-MM-DDTHH:mm:ss');
        }

        searchNewEvents(wooCommerceAPI, createdDateString, 1, 100).then((events) => {
          logger.log(`events found: ${events.length}`);
          resolve(events)
        });
      });
    });
  },

  newEventOrders: async (event) => {
    // get latest event order from local db
    return new Promise((resolve) => {
      Order.findOne({ event: event._id }).sort({ createdDate: -1 }).exec().then((result) => {
        let createdDateString = '2018-01-10T00:00:00';
        if (result) {
          // search remote using local timestamp as it's saved in locIal time in woocommerce
          const createdDate = moment(result.createdDate.toISOString());
          createdDateString = createdDate.tz('Australia/Sydney').format('YYYY-MM-DDTHH:mm:ss');
        }
        // search remote woocommerce orders added after the local latest order
        searchNewOrders(wooCommerceAPI, event, createdDateString, 1, 100).then((orders) => {
          logger.log(`orders of <${event.name}> fount: ${orders.length}`);
          resolve(orders)
        }).catch((err) => logger.error(err));
      });
    });
  },
};

module.exports = seed;
