const db = require('../config/database');

async function buscarPorNFC(codigoNFC) {
    const [rows] = await db.query(
        `SELECT 
            id,
            nome,
            ra,
            email,
            curso,
            foto_url,
            codigo_rfid_nfc,
            situacao_matricula,
            status,
            penalizado_ate
        FROM alunos
        WHERE codigo_rfid_nfc = ?
        LIMIT 1`,
        [codigoNFC]
    );

    return rows[0] || null;
}

async function buscarPorId(alunoId) {
    const [rows] = await db.query(
        `SELECT
            a.id,
            a.nome,
            a.ra,
            a.email,
            a.curso,
            a.foto_url,
            a.codigo_rfid_nfc,
            a.codigo_qr,
            a.situacao_matricula,
            a.status,
            a.penalizado_ate,
            a.codigo_carteira,
            a.carteira_ativa,
            (
                SELECT MAX(ab.data_hora)
                FROM acessos_biblioteca ab
                WHERE ab.aluno_id = a.id
            ) AS ultimo_acesso
        FROM alunos a
        WHERE a.id = ?
        LIMIT 1`,
        [alunoId]
    );

    return rows[0] || null;
}

module.exports = {
    buscarPorNFC,
    buscarPorId
};
