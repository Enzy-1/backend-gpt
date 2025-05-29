import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['system', 'user', 'assistant'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
}, { _id: false });

const conversationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  // Datos explícitos del usuario
  nombre: { type: String },
  edad: { type: Number },
  genero: { type: String },
  tipoCita: { type: String },
  perfilElegido: { type: String }, // nombre o ID de la persona elegida para la cita

  messages: {
    type: [messageSchema],
    default: [],
  },

  // Conversation.js (modelo Mongoose)
assignedProfile: {
  type: String,
  default: null,
},


  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

conversationSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;
