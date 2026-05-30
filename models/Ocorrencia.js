const db = require('../config/database');

async function registrarOcorrencia({ alunoId = null, livroId = null, tipo, descricao }) {
    const [result] = await db.query(
        `INSERT INTO ocorrencias
        (
            aluno_id,
            livro_id,
            tipo,
            descricao,
            status
        )
        VALUES (?, ?, ?, ?, 'aberta')`,
        [alunoId, livroId, tipo, descricao]
    );

    return result.insertId;
}

async function listarTodas() {
    const [rows] = await db.query(
        `SELECT
            o.*,
            a.nome AS aluno_nome,
            a.ra AS aluno_ra,
            l.titulo AS livro_titulo
         FROM ocorrencias o
         LEFT JOIN alunos a ON a.id = o.aluno_id
         LEFT JOIN livros l ON l.id = o.livro_id
         ORDER BY o.id DESC`
    );

    return rows;
}

async function listarPorAluno(alunoId) {
    const [rows] = await db.query(
        `SELECT
            o.*,
            a.nome AS aluno_nome,
            a.ra AS aluno_ra,
            l.titulo AS livro_titulo
         FROM ocorrencias o
         LEFT JOIN alunos a ON a.id = o.aluno_id
         LEFT JOIN livros l ON l.id = o.livro_id
         WHERE o.aluno_id = ?
         ORDER BY o.id DESC`,
        [alunoId]
    );

    return rows;
}

module.exports = {
    registrarOcorrencia,
    listarTodas,
    listarPorAluno
};