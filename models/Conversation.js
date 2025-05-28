// models/Conversation.js
const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  prompt: String,
  response: String,
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);
