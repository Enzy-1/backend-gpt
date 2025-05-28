const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, required: true }
}, { _id: false });

const userSessionSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  messages: [messageSchema],
  updatedAt: { type: Date, default: Date.now }
});

userSessionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('UserSession', userSessionSchema);
