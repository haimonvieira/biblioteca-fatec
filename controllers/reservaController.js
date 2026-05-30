const Aluno = require('../models/Aluno');
const Reserva = require('../models/Reserva');
const LivroObra = require('../models/LivroObra');

async function criarReserva(req, res) {
    try {
        console.log('BODY RESERVA:', req.body);

        const { codigo_nfc_aluno, livro_id } = req.body;

        if (!codigo_nfc_aluno || !livro_id) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Código NFC/RFID do aluno e ID do livro são obrigatórios.',
                recebido: req.body
            });
        }

        const aluno = await Aluno.buscarPorNFC(codigo_nfc_aluno.trim());

        if (!aluno) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Aluno não encontrado pelo NFC/RFID.'
            });
        }

        if (aluno.situacao_matricula !== 'ativa') {
            return res.status(403).json({
                sucesso: false,
                mensagem: 'Aluno sem matrícula ativa.'
            });
        }

        if (aluno.status !== 'ativo') {
            return res.status(403).json({
                sucesso: false,
                mensagem: 'Aluno bloqueado ou penalizado.'
            });
        }

        const livro = await LivroObra.buscarPorId(livro_id);

        if (!livro) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Livro/obra não encontrado.'
            });
        }

        const reservaExistente = await Reserva.buscarReservaAtivaDoAlunoParaLivro(
            aluno.id,
            livro.id
        );

        if (reservaExistente) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Este aluno já possui uma reserva ativa para este livro.',
                reserva: reservaExistente
            });
        }

        const disponiveis = await LivroObra.contarExemplaresDisponiveis(livro.id);

        if (disponiveis <= 0) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Não há exemplares disponíveis para reserva no momento.'
            });
        }

        const reservaId = await Reserva.criarReserva(aluno.id, livro.id, 2);

        return res.json({
            sucesso: true,
            mensagem: 'Reserva criada com sucesso.',
            reserva: {
                id: reservaId,
                validade: '2 horas',
                aluno: {
                    id: aluno.id,
                    nome: aluno.nome,
                    ra: aluno.ra
                },
                livro: {
                    id: livro.id,
                    titulo: livro.titulo,
                    autor: livro.autor
                }
            }
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao criar reserva.',
            erro: error.message
        });
    }
}

async function listarReservasDoAluno(req, res) {
    try {
        const { aluno_id } = req.params;

        const reservas = await Reserva.listarReservasPorAluno(aluno_id);

        return res.json({
            sucesso: true,
            reservas
        });

    } catch (error) {
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao listar reservas.',
            erro: error.message
        });
    }
}

async function cancelarReserva(req, res) {
    try {
        const { reserva_id } = req.body;

        if (!reserva_id) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'ID da reserva é obrigatório.'
            });
        }

        const afetadas = await Reserva.cancelarReserva(reserva_id);

        if (afetadas === 0) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Reserva não encontrada ou já não está ativa.'
            });
        }

        return res.json({
            sucesso: true,
            mensagem: 'Reserva cancelada com sucesso.'
        });

    } catch (error) {
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao cancelar reserva.',
            erro: error.message
        });
    }
}

module.exports = {
    criarReserva,
    listarReservasDoAluno,
    cancelarReserva
};