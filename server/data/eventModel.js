import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema({
  eventId: {
    type: Number,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  eventCode: String,
  categories: [String],
  status: String,
  startDate: Date,
  duration: Number,
  createDate: Date,
});

module.exports = mongoose.model('event', EventSchema);
