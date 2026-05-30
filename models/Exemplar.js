const db = require('../config/database');

async function buscarPorRFID(codigoRFID) {
    const [rows] = await db.query(
        `SELECT 
            e.id AS exemplar_id,
            e.codigo_rfid,
            e.codigo_interno,
            e.status AS status_exemplar,
            e.localizacao,

            l.id AS livro_id,
            l.titulo,
            l.autor,
            l.editora,
            l.capa_url
        FROM exemplares e
        INNER JOIN livros l ON l.id = e.livro_id
        WHERE e.codigo_rfid = ?
        LIMIT 1`,
        [codigoRFID]
    );

    return rows[0] || null;
}

async function atualizarStatus(exemplarId, status) {
    await db.query(
        'UPDATE exemplares SET status = ? WHERE id = ?',
        [status, exemplarId]
    );
}

module.exports = {
    buscarPorRFID,
    atualizarStatus
};