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

module.exports = {
    buscarPorNFC
};