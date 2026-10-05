const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. REGISTER CUSTOMER
exports.register = async (req, res) => {
  const { name, email, phone, password, confirmPassword, agreeTerms } = req.body;

  try {
    // Validasi Persetujuan Syarat & Ketentuan
    // Validasi Kelengkapan Field
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: 'Semua kolom wajib diisi.' });
    }

    // Validasi Kesesuaian Kata Sandi

    // Validasi Panjang Sandi minimal 8 karakter
    if (password.length < 8) {
      return res.status(400).json({ message: 'Kata sandi minimal 8 karakter.' });
    }

    // Cek apakah Email Sudah Terdaftar
    const existingUser = await db.query('SELECT * FROM customers WHERE email = $1', [email.toLowerCase().trim()]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Alamat email sudah terdaftar.' });
    }

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Simpan ke Database
    const newUser = await db.query(
      `INSERT INTO customers (name, email, phone, password) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name, email, phone, created_at`,
      [name.trim(), email.toLowerCase().trim(), phone.trim(), hashedPassword]
    );

    const customer = newUser.rows[0];

    // Generate JWT Token (Expired 7 Hari)
    const token = jwt.sign(
      { id: customer.id, email: customer.email, role: 'customer' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'Pendaftaran akun berhasil!',
      token,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
    });

  } catch (error) {
    console.error('Error Register:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

// 2. LOGIN CUSTOMER
exports.login = async (req, res) => {
  const { email, password, rememberMe } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Email dan kata sandi wajib diisi.' });
    }

    // Cari Customer berdasarkan Email
    const result = await db.query('SELECT * FROM customers WHERE email = $1', [email.toLowerCase().trim()]);
    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Email atau kata sandi salah.' });
    }

    const customer = result.rows[0];

    // Verifikasi Password
    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Email atau kata sandi salah.' });
    }

    // Masa Berlaku Token (Jika Ingat Saya di-centang = 30 Hari, sebaliknya = 1 Hari)
    const expiresIn = rememberMe ? '30d' : '1d';

    const token = jwt.sign(
      { id: customer.id, email: customer.email, role: 'customer' },
      process.env.JWT_SECRET,
      { expiresIn }
    );

    return res.status(200).json({
      message: 'Login berhasil!',
      token,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
    });

  } catch (error) {
    console.error('Error Login:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

// 3. GET CURRENT CUSTOMER PROFILE
exports.getProfile = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, email, phone, created_at FROM customers WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
    }

    return res.status(200).json({ customer: result.rows[0] });
  } catch (error) {
    console.error('Error Get Profile:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};