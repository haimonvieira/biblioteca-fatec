const db = require('../config/database');

async function registrarAcesso({ alunoId, tipo, metodo, status, observacao = null }) {
    const [result] = await db.query(
        `INSERT INTO acessos_biblioteca 
        (
            aluno_id,
            tipo,
            metodo_identificacao,
            status,
            observacao
        )
        VALUES (?, ?, ?, ?, ?)`,
        [alunoId, tipo, metodo, status, observacao]
    );

    return result.insertId;
}

async function registrarEventoPorta({ alunoId = null, tipoEvento, statusPorta, motivo = null }) {
    const [result] = await db.query(
        `INSERT INTO eventos_porta
        (
            aluno_id,
            tipo_evento,
            status_porta,
            motivo
        )
        VALUES (?, ?, ?, ?)`,
        [alunoId, tipoEvento, statusPorta, motivo]
    );

    return result.insertId;
}

async function listarAcessosPorAluno(alunoId) {
    const [rows] = await db.query(
        `SELECT *
         FROM acessos_biblioteca
         WHERE aluno_id = ?
         ORDER BY id DESC`,
        [alunoId]
    );

    return rows;
}

module.exports = {
    registrarAcesso,
    registrarEventoPorta,
    listarAcessosPorAluno
};