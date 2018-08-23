import _ from 'lodash';
import dev from './development';
import test from './testing';
import prod from './production';

const config = {
  dev: 'development',
  test: 'testing',
  prod: 'production',
  port: process.env.PORT || 3000,
  expireTime: 24 * 60 * 10,
};

process.env.NODE_ENV = process.env.NODE_ENV || config.prod;
config.env = process.env.NODE_ENV;

let envConfig;
switch (config.env) {
  case 'development':
    envConfig = dev;
    break;
  case 'testing':
    envConfig = test;
    break;
  case 'production':
    envConfig = prod;
    break;
  default:
    envConfig = {};
}

module.exports = _.merge(config, envConfig);
