const express = require('express');
const router = express.Router();

const ocorrenciaController = require('../controllers/ocorrenciaController');

router.get('/', ocorrenciaController.listarOcorrencias);
router.get('/aluno/:aluno_id', ocorrenciaController.listarOcorrenciasAluno);

module.exports = router;