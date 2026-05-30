const express = require('express');
const router = express.Router();

const nfcController = require('../controllers/nfcController');

router.post('/aluno/validar', nfcController.validarAlunoNFC);

module.exports = router;