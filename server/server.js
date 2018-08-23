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

wooCommerce.getAsync('products/1964').then((result) => {
  logger.log(JSON.parse(result.body));
});
