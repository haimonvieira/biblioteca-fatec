const db = require('../config/database');

async function criarEmprestimo(alunoId, livroId, exemplarId, reservaId = null) {
    const [result] = await db.query(
        `INSERT INTO emprestimos 
        (
            aluno_id, 
            livro_id,
            exemplar_id,
            reserva_id, 
            data_retirada, 
            data_prevista_devolucao, 
            status,
            validacao_facial_status
        )
        VALUES 
        (
            ?, 
            ?,
            ?,
            ?, 
            NOW(), 
            DATE_ADD(NOW(), INTERVAL 7 DAY), 
            'ativo',
            'nao_realizada'
        )`,
        [alunoId, livroId, exemplarId, reservaId]
    );

    return result.insertId;
}

async function buscarEmprestimoAtivoPorExemplar(exemplarId) {
    const [rows] = await db.query(
        `SELECT 
            e.id,
            e.aluno_id,
            e.livro_id,
            e.exemplar_id,
            e.data_retirada,
            e.data_prevista_devolucao,
            e.data_devolucao,
            e.status,

            a.nome AS aluno_nome,
            a.ra AS aluno_ra,

            l.titulo AS livro_titulo,
            l.autor AS livro_autor,

            ex.codigo_rfid,
            ex.codigo_interno,
            ex.localizacao
        FROM emprestimos e
        INNER JOIN alunos a ON a.id = e.aluno_id
        INNER JOIN livros l ON l.id = e.livro_id
        INNER JOIN exemplares ex ON ex.id = e.exemplar_id
        WHERE e.exemplar_id = ? 
        AND e.status = 'ativo'
        LIMIT 1`,
        [exemplarId]
    );

    return rows[0] || null;
}

async function registrarDevolucao(emprestimoId) {
    await db.query(
        `UPDATE emprestimos
         SET 
            data_devolucao = NOW(),
            status = 'devolvido'
         WHERE id = ?`,
        [emprestimoId]
    );
}

async function listarPorAluno(alunoId) {
    const [rows] = await db.query(
        `SELECT
            e.id,
            e.aluno_id,
            e.livro_id,
            e.exemplar_id,
            e.data_retirada,
            e.data_prevista_devolucao,
            e.data_devolucao,
            e.status,

            l.titulo,
            l.autor,
            l.capa_url,

            ex.codigo_rfid,
            ex.codigo_interno,
            ex.localizacao
         FROM emprestimos e
         INNER JOIN livros l ON l.id = e.livro_id
         INNER JOIN exemplares ex ON ex.id = e.exemplar_id
         WHERE e.aluno_id = ?
         ORDER BY e.id DESC`,
        [alunoId]
    );

    return rows;
}

async function listarAtivos() {
    const [rows] = await db.query(
        `SELECT
            e.id,
            e.aluno_id,
            e.livro_id,
            e.exemplar_id,
            e.data_retirada,
            e.data_prevista_devolucao,
            e.status,

            a.nome AS aluno_nome,
            a.ra AS aluno_ra,

            l.titulo,
            l.autor,

            ex.codigo_rfid,
            ex.codigo_interno,
            ex.localizacao
         FROM emprestimos e
         INNER JOIN alunos a ON a.id = e.aluno_id
         INNER JOIN livros l ON l.id = e.livro_id
         INNER JOIN exemplares ex ON ex.id = e.exemplar_id
         WHERE e.status = 'ativo'
         ORDER BY e.data_retirada DESC`
    );

    return rows;
}

module.exports = {
    criarEmprestimo,
    buscarEmprestimoAtivoPorExemplar,
    registrarDevolucao,
    listarPorAluno,
    listarAtivos
};