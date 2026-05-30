const express = require('express');
const router = express.Router();

const emprestimoController = require('../controllers/emprestimoController');

router.post('/registrar', emprestimoController.registrarEmprestimo);
router.get('/aluno/:aluno_id', emprestimoController.listarEmprestimosAluno);
router.get('/ativos', emprestimoController.listarEmprestimosAtivos);

module.exports = router;