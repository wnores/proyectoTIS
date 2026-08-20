// models/usuario.model.js
// Todas las consultas SQL relacionadas a la tabla "usuarios" viven acá.
// Los controllers llaman a estas funciones en vez de escribir SQL directamente.

const pool = require('../config/db');

// Busca un usuario por email. Devuelve undefined si no existe.
async function buscarPorEmail(email) {
  const [filas] = await pool.query(
    'SELECT * FROM usuarios WHERE email = ?',
    [email]
  );
  return filas[0];
}

// Busca un usuario por id (sin devolver la contraseña).
async function buscarPorId(id) {
  const [filas] = await pool.query(
    'SELECT id, nombre, apellido, email, rol, fecha_registro FROM usuarios WHERE id = ?',
    [id]
  );
  return filas[0];
}

// Crea un nuevo usuario. "contrasenaHasheada" ya debe venir encriptada con bcrypt.
async function crearUsuario({ nombre, apellido, email, contrasenaHasheada, rol = 'alumno' }) {
  const [resultado] = await pool.query(
    'INSERT INTO usuarios (nombre, apellido, email, contrasena, rol) VALUES (?, ?, ?, ?, ?)',
    [nombre, apellido, email, contrasenaHasheada, rol]
  );
  return resultado.insertId;
}

module.exports = {
  buscarPorEmail,
  buscarPorId,
  crearUsuario
};
