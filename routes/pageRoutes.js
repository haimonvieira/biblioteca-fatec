const express = require('express');
const router = express.Router();
const pageController = require('../controllers/pageController');

router.get('/', pageController.redirectToBiblioteca);
router.get('/biblioteca', pageController.biblioteca);
router.get('/livro/:id', pageController.detalhesLivro);
router.post('/reserva/criar', pageController.criarReserva);
router.get('/reservas/:aluno_id', pageController.minhasReservas);
router.post('/reservas/cancelar', pageController.cancelarReserva);
router.get('/emprestimos/:aluno_id', pageController.emprestimosAluno);
router.get('/vigilante', pageController.painelVigilante);
router.get('/monitor', pageController.monitorEstacao);

module.exports = router;
