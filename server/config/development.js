module.exports = {
  logging: true,
  woo: {
    key: process.env.wooStagingKey || '',
    secret: process.env.wooStagingSecret || '',
    baseUrl: 'http://staging.informa.com.au',
  },
  db: {
    url: 'mongodb://localhost/informacharts',
  },
  defaultSearchStartDate: {
    event: '2018-07-01T00:00:00',
    order: '2018-01-01T00:00:00',
  },
};
