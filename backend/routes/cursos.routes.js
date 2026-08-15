// routes/cursos.routes.js
const express = require('express');
const router = express.Router();
const cursosController = require('../controllers/cursos.controller');

router.get('/', cursosController.listarCursos);
router.get('/:id', cursosController.obtenerCurso);

module.exports = router;
