// routes/beca.routes.js
const express = require('express');
const router = express.Router();
const becaController = require('../controllers/beca.controller');

router.post('/', becaController.solicitarBeca);

module.exports = router;
