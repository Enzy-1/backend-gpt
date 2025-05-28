import OpenAI from 'openai';
import Conversation from '../models/Conversation.js';
import UserSession from '../models/UserSession.js';
import dotenv from 'dotenv';

dotenv.config();

// Inicializar OpenAI
let openai;
try {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('La variable de entorno OPENAI_API_KEY no está definida');
  openai = new OpenAI({ apiKey });
  console.log('✅ OpenAI configurado correctamente');
} catch (error) {
  console.error('Error al inicializar OpenAI:', error);
}

// Generar respuesta de ChatGPT con contexto y pasos
export const generateChatResponse = async (req, res) => {
  try {
    const { prompt, userId } = req.body;

    if (!prompt || !userId) {
      return res.status(400).json({ error: 'Se requiere el prompt y userId' });
    }

    if (!openai) {
      return res.status(500).json({ error: 'OpenAI no está configurado correctamente' });
    }

    // 1. Buscar o crear sesión
    let session = await UserSession.findOne({ userId });
    if (!session) {
      session = new UserSession({
        userId,
        step: 1,
        messages: [
          {
            role: "system",
            content: `🎀 Nombre del agente: Clara
Rol: Asistente virtual para agendar citas románticas.
El usuario está en el paso 1. Responde según ese paso y nunca reinicies el flujo.
Nunca vuelvas a saludar si ya lo hiciste.`
          }
        ]
      });
    }

    // 2. Agregar el mensaje del usuario al historial
    session.messages.push({ role: "user", content: prompt });

    // 3. Llamar a OpenAI con el historial completo
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: session.messages,
      max_tokens: 300,
      temperature: 0.7
    });

    const assistantReply = completion.choices[0].message.content;

    // 4. Agregar la respuesta al historial
    session.messages.push({ role: "assistant", content: assistantReply });

    // 5. Actualizar el paso automáticamente si aplica
    if (session.step < 4) {
      session.step++;
    }

    await session.save(); // guardar todo: historial + paso

    // 6. Guardar en colección general de conversaciones
    const conversation = new Conversation({ prompt, response: assistantReply });
    await conversation.save();

    res.json({ response: assistantReply });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al procesar la solicitud', details: error.message });
  }
};
