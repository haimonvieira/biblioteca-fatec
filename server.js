const express = require('express');
const path = require('path');
const fs = require('fs');
const db = require('./config/database');
const Aluno = require('./models/Aluno');
require('dotenv').config();

const app = express();

// Configuração do EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares para receber JSON e formulário
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Arquivos públicos, se quiser usar imagens/css depois
app.use(express.static(path.join(__dirname, 'public')));

function formatDateTime(value) {
    if (!value) {
        return 'Sem registro';
    }

    return new Date(value).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function normalizeNameForImage(nome) {
    return String(nome || 'aluno')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .split(/\s+/)[0]
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '') || 'aluno';
}

function resolveAlunoFotoUrl(aluno) {
    const fotoUrl = aluno?.foto_url || '';
    if (fotoUrl.startsWith('/img/') || fotoUrl.startsWith('http://') || fotoUrl.startsWith('https://')) {
        return fotoUrl;
    }

    const imageName = normalizeNameForImage(aluno?.nome);
    const extensions = ['jpeg', 'jpg', 'png'];
    const matchedExtension = extensions.find((extension) => {
        return fs.existsSync(path.join(__dirname, 'public', 'img', `${imageName}.${extension}`));
    });

    return `/img/${imageName}.${matchedExtension || 'jpeg'}`;
}

function buildFallbackUsuarioAtual() {
    return {
        id: 1,
        nome: 'Haimon',
        ra: '123456',
        curso: 'DSM',
        periodo: '',
        status: 'Ativo',
        foto_url: '/img/haimon.jpeg',
        ultimoAcesso: 'Sem registro',
        dispositivo: 'Totem NFC Biblioteca',
        leitor: 'Leitor RFID #04',
        local: 'Biblioteca Central',
        sessao: 'Aluno padrão'
    };
}

function mapAlunoToUsuarioAtual(aluno) {
    return {
        id: aluno.id,
        nome: aluno.nome,
        ra: aluno.ra,
        email: aluno.email,
        curso: aluno.curso || 'Não informado',
        periodo: '',
        status: aluno.status || aluno.situacao_matricula || 'Não informado',
        foto_url: resolveAlunoFotoUrl(aluno),
        codigo_rfid_nfc: aluno.codigo_rfid_nfc,
        codigo_carteira: aluno.codigo_carteira,
        carteira_ativa: aluno.carteira_ativa,
        ultimoAcesso: formatDateTime(aluno.ultimo_acesso),
        dispositivo: 'Totem NFC Biblioteca',
        leitor: 'Leitor RFID #04',
        local: 'Biblioteca Central',
        sessao: 'Aluno carregado da tabela alunos'
    };
}

// Sessão simples para demonstração: o aluno logado é sempre o primeiro cadastro.
app.use(async (req, res, next) => {
    try {
        const aluno = await Aluno.buscarPorId(1);
        res.locals.usuarioAtual = aluno ? mapAlunoToUsuarioAtual(aluno) : buildFallbackUsuarioAtual();
    } catch (error) {
        console.error('Erro ao carregar aluno logado:', error.message);
        res.locals.usuarioAtual = buildFallbackUsuarioAtual();
    }

    next();
});
app.get('/', (req, res) => {
    res.redirect('/app/biblioteca');
});

//Rotas
const nfcRoutes = require('./routes/nfcRoutes.js');
app.use('/nfc', nfcRoutes);

const livroRoutes = require('./routes/livroRoutes.js');
app.use('/livros', livroRoutes);

const emprestimoRoutes = require('./routes/emprestimoRoutes.js');
app.use('/emprestimos', emprestimoRoutes);

const devolucaoRoutes = require('./routes/devolucaoRoutes.js');
app.use('/devolucoes', devolucaoRoutes);

const acessoRoutes = require('./routes/acessoRoutes.js');
app.use('/acessos', acessoRoutes);

const reservaRoutes = require('./routes/reservaRoutes.js');
app.use('/reservas', reservaRoutes);

const ocorrenciaRoutes = require('./routes/ocorrenciaRoutes.js');
app.use('/ocorrencias', ocorrenciaRoutes);

const pageRoutes = require('./routes/pageRoutes.js');
app.use('/app', pageRoutes);

// Teste do RFID do livro
app.get('/rfid/check/:codigo', async (req, res) => {
    try {
        const codigoRFID = req.params.codigo;

        const [rows] = await db.query(
            'SELECT * FROM livros WHERE codigo_rfid = ? LIMIT 1',
            [codigoRFID]
        );

        if (rows.length === 0) {
            return res.send(`
                <h1>Livro não encontrado</h1>
                <p>Código lido: <strong>${codigoRFID}</strong></p>
            `);
        }

        const livro = rows[0];

        return res.send(`
            <h1>Livro encontrado ✅</h1>

            <p><strong>Código RFID:</strong> ${livro.codigo_rfid}</p>
            <p><strong>Título:</strong> ${livro.titulo}</p>
            <p><strong>Autor:</strong> ${livro.autor || 'Não informado'}</p>
            <p><strong>Status:</strong> ${livro.status}</p>
        `);

    } catch (error) {
        console.error(error);

        return res.status(500).send(`
            <h1>Erro no servidor</h1>
            <p>${error.message}</p>
        `);
    }
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
}

module.exports = app;

