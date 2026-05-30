const db = require('../config/database');
const https = require('https');

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Hackathon-App/1.0' } }, (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (error) {
                    reject(error);
                }
            });
        }).on('error', reject);
    });
}

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

async function buscarCapaUrlPorISBN(isbn) {
    if (!isbn) {
        return null;
    }

    try {
        const response = await fetchJson(`https://openlibrary.org/api/books?bibkeys=ISBN:${encodeURIComponent(isbn)}&format=json&jscmd=data`);
        const data = response[`ISBN:${isbn}`];
        if (!data) {
            return null;
        }
        return data.cover?.large || data.cover?.medium || data.cover?.small || null;
    } catch (error) {
        return null;
    }
}

async function buscarCapaUrlPorBusca(titulo, autor) {
    if (!titulo) {
        return null;
    }

    try {
        const query = `title=${encodeURIComponent(titulo)}${autor ? `&author=${encodeURIComponent(autor)}` : ''}&limit=1`;
        const response = await fetchJson(`https://openlibrary.org/search.json?${query}`);
        if (!response.docs || response.docs.length === 0) {
            return null;
        }
        const doc = response.docs[0];
        const isbn = Array.isArray(doc.isbn) && doc.isbn.length ? doc.isbn[0] : null;
        if (isbn) {
            const coverUrl = await buscarCapaUrlPorISBN(isbn);
            if (coverUrl) {
                return coverUrl;
            }
        }
        if (doc.cover_edition_key) {
            return `https://covers.openlibrary.org/b/olid/${doc.cover_edition_key}-L.jpg`;
        }
        return null;
    } catch (error) {
        return null;
    }
}

async function atualizarCapaUrl(livroId, capaUrl) {
    if (!capaUrl) {
        return false;
    }
    await db.query('UPDATE livros SET capa_url = ? WHERE id = ?', [capaUrl, livroId]);
    return true;
}

async function atualizarCapasFaltantes() {
    const [rows] = await db.query(
        `SELECT id, titulo, autor, isbn FROM livros WHERE capa_url IS NULL OR TRIM(capa_url) = ''`
    );

    let atualizados = 0;
    for (const livro of rows) {
        let capaUrl = null;
        if (livro.isbn) {
            capaUrl = await buscarCapaUrlPorISBN(livro.isbn);
        }
        if (!capaUrl) {
            capaUrl = await buscarCapaUrlPorBusca(livro.titulo, livro.autor);
        }
        if (capaUrl) {
            const atualizado = await atualizarCapaUrl(livro.id, capaUrl);
            if (atualizado) {
                atualizados += 1;
            }
        }
    }

    return { atualizados, total: rows.length };
}

module.exports = {
    listarAcervo,
    buscarDetalhes,
    listarExemplares,
    atualizarCapasFaltantes
};