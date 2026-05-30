const express = require('express');
const router = express.Router();

const reservaController = require('../controllers/reservaController');

router.post('/criar', reservaController.criarReserva);
router.get('/aluno/:aluno_id', reservaController.listarReservasDoAluno);
router.post('/cancelar', reservaController.cancelarReserva);

module.exports = router;