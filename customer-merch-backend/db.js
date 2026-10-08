const { Pool } = require('pg');
require('dotenv').config();

// Menggunakan connectionString dari process.env.DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Pengecekan tes koneksi awal saat server di-start
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Gagal terhubung ke database PostgreSQL Supabase:', err.message);
  } else {
    console.log('✅ Berhasil terhubung ke database PostgreSQL (Supabase Cloud)!');
  }
});

pool.on('error', (err) => {
  console.error('Koneksi PostgreSQL error:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};