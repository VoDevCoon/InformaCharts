import request from 'request-promise';
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';
import config from '../config/config';
import logger from '../util/logger';

module.exports.test = function () {
  const oauth = OAuth({
    consumer: {
      key: config.woo.key,
      secret: config.woo.secret,
    },
    signature_method: 'HMAC-SHA1',
    hash_function(baseString, key) {
      logger.log(baseString);
      return crypto.createHmac('sha1', key).update(baseString).digest('base64');
    },
  });

  const requestData = {
    url: `${config.woo.baseUrl}/orders`,
    method: 'GET',
  };

  const options = {
    url: requestData.url,
    method: requestData.method,
    form: oauth.authorize(requestData),
  };


  request(options).then((result) => {
    logger.log(result);
  }).catch((err) => { logger.error(err.error); });
};
