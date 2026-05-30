const express = require('express');
const path = require('path');
const db = require('./config/database');
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

// Simula uma sessão de usuário sem login para o painel do aluno
app.use((req, res, next) => {
    res.locals.usuarioAtual = {
        id: 1,
        nome: 'Haimon Santos',
        ra: '2023001',
        curso: 'Análise e Desenvolvimento de Sistemas',
        periodo: '5º Semestre',
        status: 'Ativo',
        ultimoAcesso: new Date(Date.now() - 25 * 60000).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }),
        dispositivo: 'Totem NFC Biblioteca',
        leitor: 'Leitor RFID #04',
        local: 'Biblioteca Central',
        sessao: 'Simulada para demonstração do aluno'
    };
    next();
});

app.get('/', (req, res) => {
    res.send('Servidor da biblioteca funcionando!');
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
