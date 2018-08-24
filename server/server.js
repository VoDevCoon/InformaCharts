import WooCommerceAPI from 'woocommerce-api';
import _ from 'lodash';
import config from './config/config';
import logger from './util/logger';

const wooCommerce = new WooCommerceAPI({
  url: config.woo.baseUrl,
  consumerKey: config.woo.key,
  consumerSecret: config.woo.secret,
  wpAPI: true,
  version: 'wc/v2',
});

const events = [];

wooCommerce.getAsync('products/?per_page=50&page=1').then((result) => {
  JSON.parse(result.body).forEach((c) => {
    const event = {
      eventId: c.id,
      name: c.name,
      eventCode: _.filter(c.meta_data, { key: 'event_code' })[0].value,
      categories: _.map(c.categories, 'name'),
      status: _.filter(c.meta_data, { key: 'event_status' })[0].value,
      startDate: _.filter(c.meta_data, { key: 'starts' })[0].value,
      duration: _.filter(c.meta_data, { key: 'duration' })[0].value,
      createdDate: c.date_created,
    };
    if (_.includes(event.categories, 'Conferences')) {
      events.push(event);
    }
  });

  logger.log(events);
});
