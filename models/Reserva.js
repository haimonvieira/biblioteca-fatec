const db = require('../config/database');

async function buscarReservaAtivaDoLivro(livroId) {
    const [rows] = await db.query(
        `SELECT *
         FROM reservas
         WHERE livro_id = ?
         AND status = 'ativa'
         AND expira_em > NOW()
         LIMIT 1`,
        [livroId]
    );

    return rows[0] || null;
}

async function buscarReservaAtivaDoAlunoParaLivro(alunoId, livroId) {
    const [rows] = await db.query(
        `SELECT *
         FROM reservas
         WHERE aluno_id = ?
         AND livro_id = ?
         AND status = 'ativa'
         AND expira_em > NOW()
         LIMIT 1`,
        [alunoId, livroId]
    );

    return rows[0] || null;
}

async function criarReserva(alunoId, livroId, horasValidade = 2) {
    const [result] = await db.query(
        `INSERT INTO reservas
        (
            aluno_id,
            livro_id,
            status,
            data_reserva,
            expira_em
        )
        VALUES
        (
            ?,
            ?,
            'ativa',
            NOW(),
            DATE_ADD(NOW(), INTERVAL ? HOUR)
        )`,
        [alunoId, livroId, horasValidade]
    );

    return result.insertId;
}

async function listarReservasPorAluno(alunoId) {
    const [rows] = await db.query(
        `SELECT
            r.id,
            r.aluno_id,
            r.livro_id,
            r.status,
            r.data_reserva,
            r.expira_em,
            r.data_cancelamento,
            r.data_retirada,

            l.titulo,
            l.autor,
            l.capa_url
         FROM reservas r
         INNER JOIN livros l ON l.id = r.livro_id
         WHERE r.aluno_id = ?
         ORDER BY r.id DESC`,
        [alunoId]
    );

    return rows;
}

async function cancelarReserva(reservaId) {
    const [result] = await db.query(
        `UPDATE reservas
         SET
            status = 'cancelada',
            data_cancelamento = NOW()
         WHERE id = ?
         AND status = 'ativa'`,
        [reservaId]
    );

    return result.affectedRows;
}

async function marcarComoRetirada(reservaId) {
    await db.query(
        `UPDATE reservas
         SET status = 'retirada',
             data_retirada = NOW()
         WHERE id = ?`,
        [reservaId]
    );
}

module.exports = {
    buscarReservaAtivaDoLivro,
    buscarReservaAtivaDoAlunoParaLivro,
    criarReserva,
    listarReservasPorAluno,
    cancelarReserva,
    marcarComoRetirada
};