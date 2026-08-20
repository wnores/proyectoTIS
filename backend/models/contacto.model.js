// models/contacto.model.js
const pool = require('../config/db');

// Guarda un mensaje enviado desde contacto.html
async function crearMensaje({ nombre, email, mensaje }) {
  const [resultado] = await pool.query(
    'INSERT INTO mensajes_contacto (nombre, email, mensaje) VALUES (?, ?, ?)',
    [nombre, email, mensaje]
  );
  return resultado.insertId;
}

module.exports = {
  crearMensaje
};
