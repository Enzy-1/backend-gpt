import mongoose from 'mongoose';

const userSessionSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true }, // Por ejemplo, número de WhatsApp, email o UUID
  step: { type: Number, default: 1 }, // Paso actual del flujo (1 a 4)
  nombre: String,
  edad: Number,
  genero: String,
  tipoCita: String,
  perfilElegido: String,
  lastInteraction: { type: Date, default: Date.now }
});

export default mongoose.model('UserSession', userSessionSchema);
