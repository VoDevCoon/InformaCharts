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
  // logger.log(`eventid: ${eventId} | date: ${moment(date)}`);
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
  eventOrdersByDayOfMonth: async (event, monthsBefore) => {
    const dailyOrders = [];
    let totalBookings = 0;
    let totalRevenue = 0;

    //const startDateOfMonth = moment().tz('Australia/Sydney').startOf('month').subtract(monthsBefore, 'months').unix() * 1000;
    const startDateOfMonth = moment().startOf('month').subtract(monthsBefore, 'months').unix() * 1000;
    for (let i = 0; i < moment(startDateOfMonth).daysInMonth(); i += 1) {
      const date = moment(startDateOfMonth).add(i, 'days');
      const ordersOfDate = await eventOrdersByDate(event._id, date);
      dailyOrders.push({ [date.date()]: ordersOfDate });
      totalBookings += ordersOfDate.bookings;
      totalRevenue += ordersOfDate.revenue;
    }

    const ordersByMonth = {
      eventId: event._id,
      eventName: event.name,
      eventCode: event.eventCode,
      dailyOrders,
      totalBookings,
      totalRevenue,
    };

    return ordersByMonth;
  },

  eventOrdersByDayOfWeek: async (event, weeksBefore) => {
    const dailyOrders = [];
    let totalBookings = 0;
    let totalRevenue = 0;

    // const startDateOfWeek = moment().tz('Australia/Sydney').startOf('isoWeek').subtract(weeksBefore, 'weeks').unix() * 1000;
    const startDateOfWeek = moment().startOf('isoWeek').subtract(weeksBefore, 'weeks').unix() * 1000;

    for (let i = 0; i < 7; i += 1) {
      const date = moment(startDateOfWeek).add(i, 'days');
      const ordersOfDate = await eventOrdersByDate(event._id, date);
      dailyOrders.push({ [date.format('ddd')]: ordersOfDate });
      totalBookings += ordersOfDate.bookings;
      totalRevenue += ordersOfDate.revenue;
    }

    const ordersByWeek = {
      eventId: event._id,
      eventCode: event.eventCode,
      eventName: event.name,
      dailyOrders,
      totalBookings,
      totalRevenue,
    };

    return ordersByWeek;
  },

  eventOrdersToday: async (event) => {
    const date = moment((new Date()).setHours(0, 0, 0, 0)).tz('Australia/Sydney');
    const ordersOfDate = await eventOrdersByDate(event._id, date);

    ordersOfDate.name = event.name;

    return ordersOfDate;
  },
};
module.exports = OrderService;
