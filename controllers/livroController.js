const Livro = require('../models/Livro');

async function validarLivroRFID(req, res) {
    try {
        const { codigo_rfid } = req.body;

        if (!codigo_rfid) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Código RFID do livro não enviado.'
            });
        }

        const livro = await Livro.buscarPorRFID(codigo_rfid.trim());

        if (!livro) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Livro não encontrado.',
                codigo_lido: codigo_rfid
            });
        }

        return res.json({
            sucesso: true,
            mensagem: 'Livro identificado com sucesso.',
            livro
        });

    } catch (error) {
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao validar livro.',
            erro: error.message
        });
    }
}

module.exports = {
    validarLivroRFID
};