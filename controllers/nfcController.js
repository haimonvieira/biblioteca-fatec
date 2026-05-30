const Aluno = require('../models/Aluno.js');

async function validarAlunoNFC(req, res) {
    try {
        const { codigo_nfc } = req.body;

        if (!codigo_nfc) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Código NFC/RFID não enviado.'
            });
        }

        const codigoLimpo = codigo_nfc.trim();

        const aluno = await Aluno.buscarPorNFC(codigoLimpo);

        if (!aluno) {
            return res.status(404).json({
                sucesso: false,
                autorizado: false,
                mensagem: 'Aluno não cadastrado para este NFC/RFID.',
                codigo_lido: codigoLimpo
            });
        }

        if (aluno.situacao_matricula !== 'ativa') {
            return res.status(403).json({
                sucesso: false,
                autorizado: false,
                mensagem: 'Aluno sem matrícula ativa.',
                aluno
            });
        }

        if (aluno.status === 'bloqueado') {
            return res.status(403).json({
                sucesso: false,
                autorizado: false,
                mensagem: 'Aluno bloqueado.',
                aluno
            });
        }

        if (aluno.status === 'penalizado') {
            return res.status(403).json({
                sucesso: false,
                autorizado: false,
                mensagem: 'Aluno penalizado temporariamente.',
                aluno
            });
        }

        return res.json({
            sucesso: true,
            autorizado: true,
            mensagem: 'Aluno identificado e autorizado.',
            aluno: {
                id: aluno.id,
                nome: aluno.nome,
                ra: aluno.ra,
                curso: aluno.curso,
                foto_url: aluno.foto_url,
                status: aluno.status,
                situacao_matricula: aluno.situacao_matricula
            }
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            sucesso: false,
            autorizado: false,
            mensagem: 'Erro ao validar NFC/RFID.',
            erro: error.message
        });
    }
}

module.exports = {
    validarAlunoNFC
};