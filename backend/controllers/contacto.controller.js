// controllers/contacto.controller.js
// Lógica de contacto.html

const contactoModel = require('../models/contacto.model');

// POST /api/contacto
async function enviarMensaje(req, res) {
  try {
    const { nombre, email, mensaje } = req.body;

    if (!nombre || !email || !mensaje) {
      return res.status(400).json({ error: 'Faltan datos obligatorios.' });
    }

    const nuevaId = await contactoModel.crearMensaje({ nombre, email, mensaje });

    return res.status(201).json({
      mensaje: 'Tu mensaje fue enviado correctamente. Pronto te responderemos.',
      id: nuevaId
    });
  } catch (error) {
    console.error('Error en enviarMensaje:', error);
    return res.status(500).json({ error: 'Error del servidor al enviar el mensaje.' });
  }
}

module.exports = {
  enviarMensaje
};
