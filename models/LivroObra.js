const db = require('../config/database');

async function listarAcervo() {
    const [rows] = await db.query(
        `SELECT
            l.id,
            l.titulo,
            l.autor,
            l.editora,
            l.ano_publicacao,
            l.isbn,
            l.descricao,
            l.capa_url,

            COUNT(e.id) AS total_exemplares,
            SUM(CASE WHEN e.status = 'disponivel' THEN 1 ELSE 0 END) AS disponiveis,
            SUM(CASE WHEN e.status = 'emprestado' THEN 1 ELSE 0 END) AS emprestados,
            SUM(CASE WHEN e.status = 'reservado' THEN 1 ELSE 0 END) AS reservados,
            SUM(CASE WHEN e.status = 'bloqueado' THEN 1 ELSE 0 END) AS bloqueados

         FROM livros l
         LEFT JOIN exemplares e ON e.livro_id = l.id
         GROUP BY l.id
         ORDER BY l.titulo ASC`
    );

    return rows;
}

async function buscarDetalhes(livroId) {
    const [rows] = await db.query(
        `SELECT
            l.id,
            l.titulo,
            l.autor,
            l.editora,
            l.ano_publicacao,
            l.isbn,
            l.descricao,
            l.capa_url,

            COUNT(e.id) AS total_exemplares,
            SUM(CASE WHEN e.status = 'disponivel' THEN 1 ELSE 0 END) AS disponiveis,
            SUM(CASE WHEN e.status = 'emprestado' THEN 1 ELSE 0 END) AS emprestados,
            SUM(CASE WHEN e.status = 'reservado' THEN 1 ELSE 0 END) AS reservados,
            SUM(CASE WHEN e.status = 'bloqueado' THEN 1 ELSE 0 END) AS bloqueados

         FROM livros l
         LEFT JOIN exemplares e ON e.livro_id = l.id
         WHERE l.id = ?
         GROUP BY l.id
         LIMIT 1`,
        [livroId]
    );

    return rows[0] || null;
}

async function listarExemplares(livroId) {
    const [rows] = await db.query(
        `SELECT
            id,
            livro_id,
            codigo_rfid,
            codigo_interno,
            localizacao,
            status,
            created_at,
            updated_at
         FROM exemplares
         WHERE livro_id = ?
         ORDER BY id ASC`,
        [livroId]
    );

    return rows;
}

module.exports = {
    listarAcervo,
    buscarDetalhes,
    listarExemplares
};