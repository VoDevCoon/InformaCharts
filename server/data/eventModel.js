import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema({
  eventId: {
    type: String,
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
  startDate: Number,
  duration: Number,
  createdDate: Number,
});

module.exports = mongoose.model('event', EventSchema);
