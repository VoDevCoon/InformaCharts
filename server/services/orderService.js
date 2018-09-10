import Order from '../data/orderModel';
import logger from '../util/logger';
import moment from 'moment-timezone';

const OrderService = {
  findEventOrdersByDateRange: async (eventId, startDate, endDate) => new Promise((resolve, reject) => {
    // Order.find({ event: eventId, createdDate: { $lt: moment().unix()} })
    //   .then(orders => {logger.log(orders);resolve(orders)})
    //   .catch(err => logger.console.error(err));
    logger.log(moment().unix());
    Order.find({orderId: {'$lt': 500000}})
      .then(orders => { resolve(orders) })
      .catch(err => logger.error(err));
  }),
}
module.exports = OrderService;
