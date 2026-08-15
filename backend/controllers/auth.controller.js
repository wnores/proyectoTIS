// controllers/auth.controller.js
// Lógica de registrarse.html e ingresar.html

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const usuarioModel = require('../models/usuario.model');

// POST /api/auth/registro
async function registrar(req, res) {
  try {
    const { nombre, apellido, email, contrasena } = req.body;

    // Validación básica de datos
    if (!nombre || !apellido || !email || !contrasena) {
      return res.status(400).json({ error: 'Faltan datos obligatorios.' });
    }
    if (contrasena.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    // Verificar que el email no esté ya registrado
    const usuarioExistente = await usuarioModel.buscarPorEmail(email);
    if (usuarioExistente) {
      return res.status(409).json({ error: 'Ese email ya está registrado.' });
    }

    // Encriptar la contraseña antes de guardarla
    const contrasenaHasheada = await bcrypt.hash(contrasena, 10);

    const nuevoId = await usuarioModel.crearUsuario({
      nombre,
      apellido,
      email,
      contrasenaHasheada
    });

    return res.status(201).json({
      mensaje: 'Usuario registrado correctamente.',
      usuario: { id: nuevoId, nombre, apellido, email }
    });
  } catch (error) {
    console.error('Error en registrar:', error);
    return res.status(500).json({ error: 'Error del servidor al registrar el usuario.' });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, contrasena } = req.body;

    if (!email || !contrasena) {
      return res.status(400).json({ error: 'Debe ingresar email y contraseña.' });
    }

    const usuario = await usuarioModel.buscarPorEmail(email);
    if (!usuario) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos.' });
    }

    const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!contrasenaValida) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos.' });
    }

    // Genera un token para que el frontend lo guarde y lo mande en las próximas peticiones
    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    return res.json({
      mensaje: 'Inicio de sesión exitoso.',
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        rol: usuario.rol
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ error: 'Error del servidor al iniciar sesión.' });
  }
}

module.exports = {
  registrar,
  login
};
