module.exports = {
  logging: true,
  woo: {
    key: process.env.wooProdKey || '',
    secret: process.env.wooProdSecret || '',
    baseUrl: 'https://www.informa.com.au',
  },
  db: {
    url: 'mongodb://localhost/informacharts_prod',
  },
};
