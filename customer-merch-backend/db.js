const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
});

// Pengecekan tes koneksi awal saat server di-start
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Gagal terhubung ke database PostgreSQL:', err.message);
  } else {
    console.log('✅ Terhubung ke database PostgreSQL (merch_admin_db)');
  }
});

pool.on('error', (err) => {
  console.error('Koneksi PostgreSQL error:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};