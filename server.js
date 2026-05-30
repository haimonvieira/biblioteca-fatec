const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config();

const app = express();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Configuração do EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares para receber JSON e formulário
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Arquivos públicos, se quiser usar imagens/css depois
app.use(express.static(path.join(__dirname, 'public')));

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

// Teste do RFID do livro
app.get('/rfid/check/:codigo', async (req, res) => {
    try {
        const codigoRFID = req.params.codigo;

        const [rows] = await pool.query(
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

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});