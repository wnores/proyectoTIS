// models/curso.model.js
const pool = require('../config/db');

// Devuelve todos los cursos (para catalogo.html)
async function obtenerTodos() {
  const [filas] = await pool.query(
    'SELECT id, titulo, descripcion, precio, duracion_horas, cupos_disponibles, imagen_url FROM cursos'
  );
  return filas;
}

// Devuelve un curso por id (para descripcionDeCurso.html)
async function obtenerPorId(id) {
  const [filas] = await pool.query(
    'SELECT * FROM cursos WHERE id = ?',
    [id]
  );
  return filas[0];
}

module.exports = {
  obtenerTodos,
  obtenerPorId
};
