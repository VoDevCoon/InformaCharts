module.exports = {
  logging: true,
  woo: {
    key: process.env.wooStagingKey || '',
    secret: process.env.wooStagingSecret || '',
    baseUrl: 'http://staging.informa.com.au',
  },
  db: {
    url: 'mongodb://localhost/informacharts_dev',
  },
};
