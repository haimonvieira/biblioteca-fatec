const express = require('express');
const router = express.Router();

const devolucaoController = require('../controllers/devolucaoController');

router.post('/registrar', devolucaoController.registrarDevolucao);

module.exports = router;