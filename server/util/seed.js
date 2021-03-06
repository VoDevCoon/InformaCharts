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
          eventId: c.id.toString(),
          name: c.name,
          eventCode: _.filter(c.meta_data, { key: 'event_code' })[0].value,
          categories: _.map(c.categories, 'name'),
          status: _.filter(c.meta_data, { key: 'event_status' })[0].value,
          startDate: _.filter(c.meta_data, { key: 'starts' })[0].value
            ? getDate(_.filter(c.meta_data, { key: 'starts' })[0].value)
            : new Date('2001-01-01'),
          duration: _.filter(c.meta_data, { key: 'duration' })[0].value = ''
            ? 0
            : Number.parseInt(_.filter(c.meta_data, { key: 'duration' })[0].value, 10),
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

  wooCommerce.getAsync(query).then((result) => {
    if (result.statusCode === 200 && result.body.length > 0) {
      const orders = JSON.parse(result.body);

      orders.forEach((o) => {
        const order = {
          orderId: o.id.toString(),
          status: o.status,
          currency: o.currency,
          total: Number.parseFloat(o.total),
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

// const searchOrderById = async (wooCommerce, orderId) => new Promise((resolve, reject) => {
//   const query = `orders/${orderId}`;
//   wooCommerce.getAsync(query).then((result) => {
//     if (result.statusCode === 200 && result.body.length > 0) {
//       const order = JSON.parse(result.body);
//       logger.log(order);
//     }
//   });
// });

const searchOrdersByStatus = async (wooCommerce, status, createdDate, pageIndex, pageSize) => new Promise((resolve, reject) => {
  const ods = [];
  const query = `orders?status=${status}&per_page=${pageSize}&page=${pageIndex}&after=${createdDate}&orderby=date&order=desc`;

  // logger.log(query);
  wooCommerce.getAsync(query).then((result) => {
    if (result.statusCode === 200 && result.body.length > 0) {
      const orders = JSON.parse(result.body);
      orders.forEach((o) => {
        const order = {
          orderId: o.id.toString().trim(),
        };

        ods.push(order);
      });

      if (orders.length === pageSize) {
        const nextPage = pageIndex + 1;
        searchOrdersByStatus(wooCommerce, status, createdDate, nextPage, pageSize)
          .then(results => resolve([...ods, ...results])).catch(err => reject(err.message));
      } else {
        // logger.log(`reaching last page for ${status} orders.`);
        resolve(ods);
      }
    } else {
      logger.log(result);
      reject(result);
    }
  }).catch(err => reject(err));
});

const searchNewEventOrders = async event => new Promise((resolve, reject) => {
  // search event's latest order
  // use the event created date as search start date if no orders
  // otherwise use the latest order's created date
  // let createdDate = moment(event.createdDate).toISOString();
  let createdDateString = moment(event.createdDate).tz('Australia/Sydney').format('YYYY-MM-DDTHH:mm:ss');


  Order.findOne({ event: event._id })
    .sort({ createdDate: -1 })
    .exec()
    .then((result) => {
      if (result) {
        createdDateString = moment(result.createdDate).tz('Australia/Sydney').format('YYYY-MM-DDTHH:mm:ss');
      }

      // Adjust the datetime to compensate Resolution changes default timezone
      // after the change done by Resolution,
      // date_created of the order is converted to Australia/Sydney time (+10/+11 hours)
      // then compare to the datetime sent to woocommerce API
      // which cause &after not working properly
      const adjustedDateString = moment(createdDateString.concat('Z')).tz('Australia/Sydney').format('YYYY-MM-DDTHH:mm:ss');

      searchOrders(wooCommerceAPI, event, adjustedDateString, 1, 100)
        .then((orders) => {
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
    }).catch(err => reject(err.message));
});

// utility function to delay the process for ms amount of milliseconds
const sleep = async ms => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

const seed = {
  syncEvents: async () => new Promise((resolve, reject) => {
    process.send('>> syncing events');

    const createdDateString = config.defaultSearchStartDate.event;
    searchEvents(wooCommerceAPI, createdDateString, 1, 100).then((events) => {
      const bulkop = Event.collection.initializeUnorderedBulkOp();
      events.forEach((event) => {
        bulkop.find({ eventId: event.eventId }).upsert().updateOne(event);
      });

      bulkop.execute().then(result => resolve(result)).catch(err => reject(err.message));
    });
  }),

  syncOrders: async numberOfBatches => new Promise((resolve) => {
    Event.find({ status: 'enable' }).then(async (events) => {
      const batchSize = Math.floor(events.length / (numberOfBatches - 1));
      const batches = _.chunk(events, batchSize);
      const results = [];

      for (let j = 0; j < batches.length; j += 1) {
        const batchEvents = batches[j];
        process.send(`syncing orders -> batch number ${j + 1}`);

        for (let i = 0; i < batchEvents.length; i += 1) {
          process.send(`>> searching orders for event <${batchEvents[i].name}>`);

          const result = await addEventOrders(batchEvents[i]);
          if (result) {
            results.push(result);
          }
        }

        await sleep(Math.floor(config.workerTaskInterval.syncData / (numberOfBatches + 1)));
      }

      resolve(results);
    });
  }),

  checkNoProfitOrders: async status => new Promise((resolve, reject) => {
    const createdDate = moment(config.defaultSearchStartDate.order);
    const createdDateString = createdDate.tz('Australia/Sydney').format('YYYY-MM-DDTHH:mm:ss');

    // searchOrderById(wooCommerceAPI, '41385');

    searchOrdersByStatus(wooCommerceAPI, status, createdDateString, 1, 100)
      .then((orders) => {
        logger.log(`=> found latest ${status} orders: ${orders.length}`);

        // check if existing non-profit orders' status have been changed
        // if can't find the orderId in the latest non-profit orders,
        // update order status from 'failed'/'cancelled' to 'processing'
        const orderIds = [];
        orders.map(obj => orderIds.push(obj.orderId));

        // orderIds.splice(orderIds.indexOf('20992'), 5);
        Order.find({ status })
          .then((nonProfitOrders) => {
            if (nonProfitOrders.length > 0) {
              logger.log(`checking existing ${status} orders, total of: ${nonProfitOrders.length} `);

              let matchingCount = 0;
              nonProfitOrders.forEach((order) => {
                if (orderIds.indexOf(order.orderId) < 0) {
                  Order.update({ orderId: order.orderId }, { $set: { status: 'processing' } }, (err) => {
                    if (err) {
                      logger.error(err);
                    } else {
                      logger.log(`order modified: ${order.orderId}`);
                    }
                  });
                } else {
                  matchingCount += 1;
                }
              });
              logger.log(`matching: ${matchingCount}`);
            }
          });

        if (orders && orders.length > 0) {
          const bulkop = Order.collection.initializeUnorderedBulkOp();
          orders.forEach(async (order) => {
            bulkop.find({ orderId: order.orderId }).update({ $set: { status } });
          });

          bulkop.execute()
            .then(result => resolve(result))
            .catch(err => reject(err.message));
        } else {
          resolve();
        }
      }).catch(err => reject(err.message));
  }),
};

module.exports = seed;
