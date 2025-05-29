import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { router as chatRoutes } from './routes/chatRoutes.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { User } from './models/User.js';  // Asegúrate de que la ruta esté bien según tu estructura


// Configuración de entorno y paths
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Verificar OPENAI_API_KEY y archivo .env
if (!process.env.OPENAI_API_KEY) {
  console.warn('\x1b[33m%s\x1b[0m', '⚠️  ADVERTENCIA: No se encontró la variable OPENAI_API_KEY');
  console.log('\x1b[36m%s\x1b[0m', 'Para configurar la API key de OpenAI:');
  console.log('1. Crea un archivo .env en la carpeta backend');
  console.log('2. Añade la línea: OPENAI_API_KEY=tu-api-key-de-openai');
  console.log('3. Reinicia el servidor\n');

  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.log('\x1b[31m%s\x1b[0m', 'No se encontró el archivo .env');
  }
}

// Conexión a MongoDB
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ Error: No se ha definido MONGODB_URI en las variables de entorno.');
  process.exit(1);
}
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => {
    console.error('❌ Error de conexión a MongoDB:', err);
    process.exit(1);
  });


// Rutas
app.use('/api/chat', chatRoutes); // Asumiendo que aquí está la lógica real del chat

// Login real usando MongoDB
app.post('/api/login', async (req, res) => {
  const { userId, password } = req.body;

  if (!userId || !password) {
    return res.status(400).json({ success: false, message: 'userId y password son requeridos' });
  }

  try {
    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Usuario no encontrado' });
    }

    if (user.password !== password) {
      return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
    }

    return res.json({ success: true, userId: user.userId, name: user.name });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Registro de nuevos usuarios
app.post('/api/register', async (req, res) => {
  const { userId, password, name } = req.body;

  if (!userId || !password || !name) {
    return res.status(400).json({ success: false, message: 'Todos los campos son requeridos' });
  }

  try {
    const existingUser = await User.findOne({ userId });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'El usuario ya existe' });
    }

    const newUser = new User({ userId, password, name });
    await newUser.save();

    res.status(201).json({ success: true, userId, name });
  } catch (error) {
    console.error('❌ Error en registro:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});


// Ruta base para prueba de servidor
app.get('/', (req, res) => {
  res.json({ 
    message: 'API de ChatGPT funcionando correctamente',
    status: 'OpenAI configurado con clave fija en el controlador'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});
