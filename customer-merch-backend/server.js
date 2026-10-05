const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const checkoutRoutes = require('./routes/checkoutRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const orderTrackingRoutes = require('./routes/orderTrackingRoutes');
const accountRoutes = require('./routes/accountRoutes');
const storeRoutes = require('./routes/storeRoutes');

const app = express();

// --- PERBAIKAN KONFIGURASI CORS ---
app.use(cors({
  origin: 'http://localhost:5173', // Origin Frontend Vite / React kamu
  credentials: true,               // Mengizinkan kirim token / session cookie
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// Route API Customer
app.use('/api/customer/auth', authRoutes);
app.use('/api/customer/products', productRoutes);
app.use('/api/customer/cart', cartRoutes);
app.use('/api/customer/wishlist', wishlistRoutes);
app.use('/api/customer/checkout', checkoutRoutes);
app.use('/api/customer/payment', paymentRoutes);
app.use('/api/customer/orders', orderTrackingRoutes);
app.use('/api/customer/stores', storeRoutes);

app.get('/', (req, res) => {
  res.send('API Customer C-Merch Berjalan');
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server Customer Backend berjalan di port ${PORT}`);
});