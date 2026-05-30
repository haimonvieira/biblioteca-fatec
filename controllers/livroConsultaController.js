const LivroObra = require('../models/LivroObra');

async function listarLivros(req, res) {
    try {
        const livros = await LivroObra.listarAcervo();

        return res.json({
            sucesso: true,
            livros
        });
    } catch (error) {
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao listar acervo.',
            erro: error.message
        });
    }
}

async function detalhesLivro(req, res) {
    try {
        const { id } = req.params;

        const livro = await LivroObra.buscarDetalhes(id);

        if (!livro) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Livro não encontrado.'
            });
        }

        return res.json({
            sucesso: true,
            livro
        });
    } catch (error) {
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao buscar detalhes do livro.',
            erro: error.message
        });
    }
}

async function exemplaresLivro(req, res) {
    try {
        const { id } = req.params;

        const livro = await LivroObra.buscarDetalhes(id);

        if (!livro) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Livro não encontrado.'
            });
        }

        const exemplares = await LivroObra.listarExemplares(id);

        return res.json({
            sucesso: true,
            livro,
            exemplares
        });
    } catch (error) {
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao listar exemplares do livro.',
            erro: error.message
        });
    }
}

module.exports = {
    listarLivros,
    detalhesLivro,
    exemplaresLivro
};