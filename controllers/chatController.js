const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const Conversation = require('../models/Conversation');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post('/clara', async (req, res) => {
  try {
    const { prompt, userId } = req.body;

    if (!prompt || !userId) {
      return res.status(400).json({ error: 'Prompt y userId son requeridos' });
    }

    // Obtener historial de conversación anterior del usuario
    const previousMessages = await Conversation.find({ userId })
      .sort({ createdAt: 1 }) // Orden cronológico
      .limit(10); // Puedes aumentar el límite si quieres más memoria

    // Formatear historial para OpenAI
    const chatHistory = previousMessages.map(entry => ([
      { role: 'user', content: entry.prompt },
      { role: 'assistant', content: entry.response }
    ])).flat();

    // Insertar mensaje del sistema
    chatHistory.unshift({
      role: 'system',
      content: `Hola, soy Clara 💖, tu asistente virtual de citas. Estoy aquí para ayudarte a encontrar a tu pareja ideal. Por favor, dime tu nombre, edad, ciudad y qué tipo de persona estás buscando. También puedo recordarte tus intereses, tus citas anteriores o ayudarte a mejorar tus conversaciones.`
    });

    // Agregar el nuevo mensaje del usuario
    chatHistory.push({ role: 'user', content: prompt });

    // Llamar a la API de OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: chatHistory,
      max_tokens: 400,
      temperature: 0.8,
    });

    const response = completion.choices[0]?.message?.content;

    // Guardar esta nueva interacción
    const conversation = new Conversation({ userId, prompt, response });
    await conversation.save();

    res.json({ response });

  } catch (error) {
    console.error('Error al procesar la solicitud:', error);
    res.status(500).json({ error: 'Error al procesar la solicitud de Clara' });
  }
});

module.exports = router;
