const express = require('express');
const router = express.Router();

const livroController = require('../controllers/livroController');
const livroConsultaController = require('../controllers/livroConsultaController');

router.get('/', livroConsultaController.listarLivros);
router.get('/:id', livroConsultaController.detalhesLivro);
router.get('/:id/exemplares', livroConsultaController.exemplaresLivro);

router.post('/validar-rfid', livroController.validarLivroRFID);

module.exports = router;