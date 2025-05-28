import OpenAI from 'openai';
import Conversation from '../models/Conversation.js';
import UserSession from '../models/UserSession.js';
import dotenv from 'dotenv';

dotenv.config();

// Configurar OpenAI con manejo de errores mejorado
let openai;
try {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('La variable de entorno OPENAI_API_KEY no está definida')
  }

  openai = new OpenAI({ apiKey });
  console.log('✅ OpenAI configurado correctamente');
} catch (error) {
  console.error('Error al inicializar OpenAI:', error);
}

// Generar respuesta de ChatGPT
export const generateChatResponse = async (req, res) => {
  try {
    const { prompt, userId } = req.body;

    if (!prompt || !userId) {
      return res.status(400).json({ error: 'Se requiere el prompt y userId' });
    }

    if (!openai) {
      return res.status(500).json({ error: 'OpenAI no configurado' });
    }

    // Buscar o crear sesión del usuario
    let session = await UserSession.findOne({ userId });
    if (!session) {
      session = new UserSession({ userId });
      await session.save();
    }

    // Generar mensaje de sistema personalizado con el paso actual
    const systemMessage = `🎀 Nombre del agente: Clara
Rol: Asistente virtual para agendar citas románticas.
El usuario está en el paso ${session.step}. Responde según ese paso y nunca reinicies el flujo.
Nunca vuelvas a saludar si ya lo hiciste.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: prompt }
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const response = completion.choices[0].message.content;

      // Actualizar paso si detectas avance lógico (tú puedes implementar esto con detección de contenido o palabras clave)
    if (session.step < 4) {
      session.step++;
      await session.save();
    }

    // Guardar la conversación
    const conversation = new Conversation({ prompt, response });
    await conversation.save();

    res.json({ response });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al procesar la solicitud', details: error.message });
  }
};

// Obtener historial de conversaciones
export const getConversationHistory = async (req, res) => {
  try {
    const conversations = await Conversation.find().sort({ createdAt: -1 }).limit(10);
    res.json(conversations);
  } catch (error) {
    console.error('Error al obtener el historial:', error);
    res.status(500).json({ error: 'Error al obtener el historial de conversaciones' });
  }
};
