// server.js
// Punto de entrada del backend.
// Se ejecuta con: npm start  (o "npm run dev" si tenés nodemon)

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const cursosRoutes = require('./routes/cursos.routes');
const becaRoutes = require('./routes/beca.routes');
const contactoRoutes = require('./routes/contacto.routes');

const app = express();

// Middlewares globales
app.use(cors());            // Permite que el frontend (otro origen) consuma la API
app.use(express.json());    // Permite leer JSON en req.body

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/cursos', cursosRoutes);
app.use('/api/becas', becaRoutes);
app.use('/api/contacto', contactoRoutes);

// Ruta de prueba para verificar que el servidor está funcionando
app.get('/api/health', (req, res) => {
  res.json({ estado: 'ok', mensaje: 'Backend funcionando correctamente.' });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});
