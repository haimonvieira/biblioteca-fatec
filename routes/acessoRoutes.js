const express = require('express');
const router = express.Router();

const acessoController = require('../controllers/acessoController');

router.post('/entrada', acessoController.registrarEntrada);
router.post('/saida', acessoController.registrarSaida);
router.post('/emergencia', acessoController.registrarEmergencia);

router.get('/sessao/:aluno_id', acessoController.statusSessaoAluno);
router.get('/aluno/:aluno_id', acessoController.historicoAcessosAluno);

module.exports = router;