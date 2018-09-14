import moment from 'moment-timezone';
import _ from 'lodash';
import Order from '../data/orderModel';
import Event from '../data/eventModel';
import logger from '../util/logger';

const findEventOrdersByDateRange = async (eventId, startDate, endDate) => new Promise((resolve, reject) => {
  Order.find({ event: eventId, createdDate: { $gt: startDate, $lt: endDate } })
    .then((orders) => { resolve(orders); })
    .catch(err => reject(err));
});

const eventOrdersByDate = async (eventId, date) => {
  const orders = await findEventOrdersByDateRange(eventId, date, moment(date).add(1, 'days'));
  let ordersByDate = null;

  if (orders) {
    await Event.findOne({ _id: eventId }).then((result) => {
      if (result) {
        ordersByDate = {
          bookings: orders.length,
          revenue: _.sumBy(orders, 'total'),
          createdDate: moment(date).toDate(),
        };
      }
    }).catch(err => logger.error(err));
  }

  return ordersByDate;
};

const OrderService = {
  eventOrdersByDayOfMonth: async (event, startDateOfMonth) => {
    const dailyOrders = [];
    let totalBookings = 0;
    let totalRevenue = 0;

    for (let i = 0; i < moment(startDateOfMonth).daysInMonth(); i += 1) {
      const ordersOfDate = await eventOrdersByDate(event._id, moment(startDateOfMonth).add(i, 'days'));
      const date = moment(startDateOfMonth).add(i, 'days').date();
      dailyOrders.push({ [date]: ordersOfDate });
      totalBookings += ordersOfDate.bookings;
      totalRevenue += ordersOfDate.revenue;
    }

    const ordersByMonth = {
      eventId: event._id,
      eventName: event.name,
      dailyOrders,
      totalBookings,
      totalRevenue,
    };

    return ordersByMonth;
  },

  eventOrdersByDayOfWeek: async (event, startDateOfWeek) => {
    const dailyOrders = [];
    let totalBookings = 0;
    let totalRevenue = 0;

    for (let i = 0; i < 7; i += 1) {
      const ordersOfDate = await eventOrdersByDate(event._id, moment(startDateOfWeek).add(i, 'days'));
      const day = moment(startDateOfWeek).add(i, 'days').format('ddd');
      dailyOrders.push({ [day]: ordersOfDate });
      totalBookings += ordersOfDate.bookings;
      totalRevenue += ordersOfDate.revenue;
    }

    const ordersByWeek = {
      eventId: event._id,
      eventName: event.name,
      dailyOrders,
      totalBookings,
      totalRevenue,
    };

    return ordersByWeek;
  },
};
module.exports = OrderService;
