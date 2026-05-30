const Exemplar = require('../models/Exemplar');
const Emprestimo = require('../models/Emprestimo');

async function registrarDevolucao(req, res) {
    try {
        console.log('BODY DEVOLUÇÃO:', req.body);

        const { codigo_rfid_exemplar } = req.body;

        if (!codigo_rfid_exemplar) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Código RFID/NFC do exemplar é obrigatório.',
                recebido: req.body
            });
        }

        const exemplar = await Exemplar.buscarPorRFID(codigo_rfid_exemplar.trim());

        if (!exemplar) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Exemplar não encontrado pelo RFID/NFC.'
            });
        }

        const emprestimoAtivo = await Emprestimo.buscarEmprestimoAtivoPorExemplar(
            exemplar.exemplar_id
        );

        if (!emprestimoAtivo) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Não existe empréstimo ativo para este exemplar.',
                exemplar: {
                    id: exemplar.exemplar_id,
                    titulo: exemplar.titulo,
                    codigo_rfid: exemplar.codigo_rfid,
                    status: exemplar.status_exemplar
                }
            });
        }

        await Emprestimo.registrarDevolucao(emprestimoAtivo.id);

        await Exemplar.atualizarStatus(exemplar.exemplar_id, 'disponivel');

        return res.json({
            sucesso: true,
            mensagem: 'Devolução registrada com sucesso.',
            devolucao: {
                emprestimo_id: emprestimoAtivo.id,
                aluno: {
                    id: emprestimoAtivo.aluno_id,
                    nome: emprestimoAtivo.aluno_nome,
                    ra: emprestimoAtivo.aluno_ra
                },
                livro: {
                    id: emprestimoAtivo.livro_id,
                    titulo: emprestimoAtivo.livro_titulo,
                    autor: emprestimoAtivo.livro_autor
                },
                exemplar: {
                    id: exemplar.exemplar_id,
                    codigo_rfid: exemplar.codigo_rfid,
                    localizacao: exemplar.localizacao
                },
                status_exemplar: 'disponivel'
            }
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao registrar devolução.',
            erro: error.message
        });
    }
}

module.exports = {
    registrarDevolucao
};