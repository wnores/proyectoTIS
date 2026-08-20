// models/beca.model.js
const pool = require('../config/db');

// Guarda una nueva solicitud de beca (para beca.html)
async function crearSolicitud({ nombre, email, cursoId, motivo }) {
  const [resultado] = await pool.query(
    'INSERT INTO solicitudes_beca (nombre, email, curso_id, motivo) VALUES (?, ?, ?, ?)',
    [nombre, email, cursoId, motivo]
  );
  return resultado.insertId;
}

module.exports = {
  crearSolicitud
};
