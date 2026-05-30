const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
const useSsl = process.env.DB_SSL !== 'false' && process.env.PGSSLMODE !== 'disable';

const pool = new Pool(connectionString
    ? {
        connectionString,
        ssl: useSsl ? { rejectUnauthorized: false } : false
    }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'postgres',
        max: Number(process.env.DB_POOL_SIZE || 10),
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    });

function normalizeSql(sql) {
    return sql
        .replace(/DATE_ADD\s*\(\s*NOW\(\)\s*,\s*INTERVAL\s+\?\s+HOUR\s*\)/gi, "(NOW() + (? * INTERVAL '1 hour'))")
        .replace(/DATE_ADD\s*\(\s*NOW\(\)\s*,\s*INTERVAL\s+(\d+)\s+DAY\s*\)/gi, "NOW() + INTERVAL '$1 days'");
}

function replacePlaceholders(sql) {
    let index = 0;
    return sql.replace(/\?/g, () => `$${++index}`);
}

function addReturningId(sql) {
    if (!/^\s*INSERT\b/i.test(sql) || /\bRETURNING\b/i.test(sql)) {
        return sql;
    }

    return `${sql.replace(/;\s*$/, '')} RETURNING id`;
}

async function query(sql, params = []) {
    const normalizedSql = addReturningId(replacePlaceholders(normalizeSql(sql)));
    const result = await pool.query(normalizedSql, params);

    if (result.command === 'SELECT') {
        return [result.rows];
    }

    return [{
        insertId: result.rows[0]?.id || null,
        affectedRows: result.rowCount,
        rowCount: result.rowCount,
        rows: result.rows
    }];
}

const db = {
    query,
    execute: query,
    end: () => pool.end(),
    pool
};

module.exports = db;
