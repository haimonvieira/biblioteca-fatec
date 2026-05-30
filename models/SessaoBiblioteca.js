const db = require('../config/database');

async function buscarSessaoAtivaPorAluno(alunoId) {
    const [rows] = await db.query(
        `SELECT *
         FROM sessoes_biblioteca
         WHERE aluno_id = ?
         AND status = 'dentro'
         LIMIT 1`,
        [alunoId]
    );

    return rows[0] || null;
}

async function criarSessao(alunoId) {
    const [result] = await db.query(
        `INSERT INTO sessoes_biblioteca
        (
            aluno_id,
            entrada_em,
            status
        )
        VALUES (?, NOW(), 'dentro')`,
        [alunoId]
    );

    return result.insertId;
}

async function encerrarSessao(alunoId, status = 'saiu') {
    const [result] = await db.query(
        `UPDATE sessoes_biblioteca
         SET 
            saida_em = NOW(),
            status = ?
         WHERE aluno_id = ?
         AND status = 'dentro'`,
        [status, alunoId]
    );

    return result.affectedRows;
}

async function buscarUltimaSessaoPorAluno(alunoId) {
    const [rows] = await db.query(
        `SELECT *
         FROM sessoes_biblioteca
         WHERE aluno_id = ?
         ORDER BY id DESC
         LIMIT 1`,
        [alunoId]
    );

    return rows[0] || null;
}

module.exports = {
    buscarSessaoAtivaPorAluno,
    criarSessao,
    encerrarSessao,
    buscarUltimaSessaoPorAluno
};