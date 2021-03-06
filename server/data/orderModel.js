import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
    required: true,
  },
  total: Number,
  status: String,
  active: {
    type: Boolean,
    default: true,
  },
  currency: String,
  createdDate: Number,
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'event',
  },
});

module.exports = mongoose.model('order', OrderSchema);
