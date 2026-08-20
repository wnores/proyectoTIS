// controllers/cursos.controller.js
// Lógica de catalogo.html y descripcionDeCurso.html

const cursoModel = require('../models/curso.model');

// GET /api/cursos
async function listarCursos(req, res) {
  try {
    const cursos = await cursoModel.obtenerTodos();
    return res.json(cursos);
  } catch (error) {
    console.error('Error en listarCursos:', error);
    return res.status(500).json({ error: 'Error del servidor al obtener los cursos.' });
  }
}

// GET /api/cursos/:id
async function obtenerCurso(req, res) {
  try {
    const { id } = req.params;
    const curso = await cursoModel.obtenerPorId(id);

    if (!curso) {
      return res.status(404).json({ error: 'Curso no encontrado.' });
    }

    return res.json(curso);
  } catch (error) {
    console.error('Error en obtenerCurso:', error);
    return res.status(500).json({ error: 'Error del servidor al obtener el curso.' });
  }
}

module.exports = {
  listarCursos,
  obtenerCurso
};
