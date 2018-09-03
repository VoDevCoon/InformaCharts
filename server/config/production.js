module.exports = {
  logging: true,
  woo: {
    key: process.env.wooProdKey || '',
    secret: process.env.wooProdSecret || '',
    baseUrl: 'https://www.informa.com.au',
  },
  db: {
    url: 'mongodb://localhost/informacharts',
  },
  defaultSearchStartDate: {
    event: '2015-01-01T00:00:00',
    order: '2015-01-01T00:00:00',
  },
  workerTaskInterval: {
    syncData: 1000 * 60 * 15,
  },
};
