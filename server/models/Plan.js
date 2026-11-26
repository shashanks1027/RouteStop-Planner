// A plan (one errand run) with its stops embedded. Array order = visiting order.
const mongoose = require('mongoose');

const stopSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  opensAt: { type: String, required: true },
  closesAt: { type: String, required: true },
  priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  travelMins: { type: Number, default: 0 },
  visitMins: { type: Number, default: 15 },
  items: [{ text: { type: String, required: true }, done: { type: Boolean, default: false } }],
  completed: { type: Boolean, default: false },
});

const planSchema = new mongoose.Schema({
  title: { type: String, required: true },
  startTime: { type: String, required: true },
  stops: [stopSchema],
});

module.exports = mongoose.model('Plan', planSchema);
