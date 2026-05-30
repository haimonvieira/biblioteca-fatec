const db = require('../config/database');

async function buscarPorRFID(codigoRFID) {
    const [rows] = await db.query(
        `SELECT 
            id,
            titulo,
            autor,
            codigo_rfid,
            status,
            localizacao
        FROM livros
        WHERE codigo_rfid = ?
        LIMIT 1`,
        [codigoRFID]
    );

    return rows[0] || null;
}

async function atualizarStatus(livroId, status) {
    await db.query(
        'UPDATE livros SET status = ? WHERE id = ?',
        [status, livroId]
    );
}

module.exports = {
    buscarPorRFID,
    atualizarStatus
};