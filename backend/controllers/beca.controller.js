// controllers/beca.controller.js
// Lógica de beca.html

const becaModel = require('../models/beca.model');

// POST /api/becas
async function solicitarBeca(req, res) {
  try {
    const { nombre, email, cursoId, motivo } = req.body;

    if (!nombre || !email || !motivo) {
      return res.status(400).json({ error: 'Faltan datos obligatorios.' });
    }

    const nuevaId = await becaModel.crearSolicitud({ nombre, email, cursoId, motivo });

    return res.status(201).json({
      mensaje: 'Tu solicitud de beca fue enviada correctamente. Te contactaremos por email.',
      id: nuevaId
    });
  } catch (error) {
    console.error('Error en solicitarBeca:', error);
    return res.status(500).json({ error: 'Error del servidor al enviar la solicitud de beca.' });
  }
}

module.exports = {
  solicitarBeca
};
