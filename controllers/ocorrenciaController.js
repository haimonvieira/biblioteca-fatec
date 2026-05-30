const Ocorrencia = require('../models/Ocorrencia');

async function listarOcorrencias(req, res) {
    try {
        const ocorrencias = await Ocorrencia.listarTodas();

        return res.json({
            sucesso: true,
            ocorrencias
        });
    } catch (error) {
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao listar ocorrências.',
            erro: error.message
        });
    }
}

async function listarOcorrenciasAluno(req, res) {
    try {
        const { aluno_id } = req.params;

        const ocorrencias = await Ocorrencia.listarPorAluno(aluno_id);

        return res.json({
            sucesso: true,
            ocorrencias
        });
    } catch (error) {
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao listar ocorrências do aluno.',
            erro: error.message
        });
    }
}

module.exports = {
    listarOcorrencias,
    listarOcorrenciasAluno
};