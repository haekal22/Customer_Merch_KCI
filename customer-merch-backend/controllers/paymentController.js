const db = require('../db');
const axios = require('axios');

function finpayClient() {
  const id = process.env.FINPAY_MERCHANT_ID;
  const key = process.env.FINPAY_API_KEY;
  if (!id || !key) throw new Error('FINPAY_MERCHANT_ID / FINPAY_API_KEY belum diisi di .env');

  const basic = Buffer.from(`${id}:${key}`).toString('base64');
  return axios.create({
    baseURL: (process.env.FINPAY_BASE_URL || 'https://devo.finnet.co.id').trim().replace(/\/$/, ''),
    timeout: 15000,
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });
}

const isPaidStatus = (s) => String(s || '').toUpperCase() === 'PAID';
const PAID_STATUSES = ['paid', 'Sudah Dibayar', 'completed'];

async function fetchFinpayStatus(orderCode) {
  const { data } = await finpayClient().get(
    `/pg/payment/card/check/${encodeURIComponent(orderCode)}`
  );
  return data?.data; // { order: {...}, result: { payment: { status } } }
}

async function markPaid(orderCode) {
  await db.query(
    "UPDATE orders SET status = 'paid' WHERE order_code = $1 AND status <> ALL($2)",
    [orderCode, PAID_STATUSES]
  );
}

// -----------------------------------------------------------------------------
// 1. GET PAYMENT DETAIL & BUAT QRIS DI FINPAY
// -----------------------------------------------------------------------------
exports.getPaymentDetail = async (req, res) => {
  const customerId = req.user.id;
  const { order_id } = req.params;

  try {
    const orderRes = await db.query(
      `SELECT id, order_code, total_amount, status, payment_method,
              shipping_cost, shipping_courier, created_at, qris_payload
       FROM orders
       WHERE (id::text = $1 OR order_code = $1) AND customer_id = $2;`,
      [order_id, customerId]
    );
    if (orderRes.rows.length === 0) {
      return res.status(404).json({ message: 'Pesanan tidak ditemukan.' });
    }
    const order = orderRes.rows[0];

    const itemsRes = await db.query(
      `SELECT oi.quantity, oi.price, p.name as product_name, p.image_url
       FROM order_items oi
       LEFT JOIN product_variants pv ON oi.product_variant_id = pv.id
       LEFT JOIN products p ON pv.product_id = p.id
       WHERE oi.order_id = $1;`,
      [order.id]
    );

    const expiryTime = new Date(order.created_at).getTime() + 24 * 60 * 60 * 1000;
    const timeRemainingSeconds = Math.max(0, Math.floor((expiryTime - Date.now()) / 1000));
    const amount = Math.round(Number(order.total_amount));

    // Pakai QR yang sudah pernah dibuat, supaya refresh halaman tidak
    // membuat transaksi baru dengan order id yang sama.
    let qrisPayload = order.qris_payload;

    if (!qrisPayload && !PAID_STATUSES.includes(order.status)) {
      const body = {
        customer: {
          email: req.user.email || 'customer@example.com',
          firstName: req.user.name || req.user.first_name || 'Customer',
          lastName: req.user.last_name || '-',
          mobilePhone: req.user.phone || '+6281234567890',
        },
        order: {
          id: order.order_code,
          amount: String(amount),
          description: `Order ${order.order_code}`,
        },
        url: {
          callbackUrl: `${process.env.PUBLIC_BASE_URL}/api/payment/finpay/callback`,
        },
        sourceOfFunds: { type: 'qris' },
      };

      try {
        const { data } = await finpayClient().post('/pg/payment/card/initiate', body);
        if (data.responseCode !== '2000000' || !data.stringQr) {
          console.error('Finpay initiate ditolak:', data);
          return res.status(502).json({ message: 'Gagal membuat QRIS dari Finpay.' });
        }
        qrisPayload = data.stringQr;
        await db.query('UPDATE orders SET qris_payload = $1 WHERE id = $2', [qrisPayload, order.id]);
      } catch (err) {
        console.error('Finpay error:', err.code, err.response?.status, err.response?.data);
        return res.status(502).json({ message: 'Gagal menghubungi Finpay.' });
      }
    }

    const qrImageUrl = qrisPayload
      ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrisPayload)}`
      : '';

    return res.status(200).json({
      order_id: order.id,
      order_code: order.order_code,
      merchant_name: process.env.FINPAY_MERCHANT_NAME || 'C-Merch Official Store',
      total_amount: amount,
      status: order.status,
      created_at: order.created_at,
      time_remaining_seconds: timeRemainingSeconds,
      qris_data: { payload: qrisPayload || '', qr_image_url: qrImageUrl },
      order_items: itemsRes.rows,
      subtotal: amount - Number(order.shipping_cost || 0),
      shipping_cost: Number(order.shipping_cost || 0),
      shipping_courier: order.shipping_courier,
    });
  } catch (error) {
    console.error('Error Get Payment Detail:', error);
    return res.status(500).json({ message: 'Gagal mengambil detail pembayaran.' });
  }
};

// -----------------------------------------------------------------------------
// 2. CEK STATUS PEMBAYARAN (dipanggil frontend, tanpa bypass simulate)
// -----------------------------------------------------------------------------
exports.checkPaymentStatus = async (req, res) => {
  const customerId = req.user.id;
  const { order_id } = req.params;

  try {
    const orderRes = await db.query(
      `SELECT id, order_code, total_amount, status
       FROM orders
       WHERE (id::text = $1 OR order_code = $1) AND customer_id = $2;`,
      [order_id, customerId]
    );
    if (orderRes.rows.length === 0) {
      return res.status(404).json({ message: 'Pesanan tidak ditemukan.' });
    }
    const order = orderRes.rows[0];

    if (PAID_STATUSES.includes(order.status)) {
      return res.status(200).json({
        is_paid: true,
        message: 'Pembayaran Terdeteksi & Berhasil',
        order_code: order.order_code,
        total_amount: Number(order.total_amount),
        status: order.status,
      });
    }

    let isPaid = false;
    try {
      const info = await fetchFinpayStatus(order.order_code);
      const paidAmount = Number(info?.order?.amount);
      isPaid =
        isPaidStatus(info?.result?.payment?.status) &&
        paidAmount === Math.round(Number(order.total_amount));
    } catch (err) {
      console.error('Finpay status error:', err.code, err.response?.status, err.response?.data);
    }

    if (isPaid) {
      await markPaid(order.order_code);
      return res.status(200).json({
        is_paid: true,
        message: 'Pembayaran Terdeteksi & Berhasil',
        order_code: order.order_code,
        total_amount: Number(order.total_amount),
      });
    }

    return res.status(200).json({ is_paid: false, message: 'Pembayaran belum terdeteksi' });
  } catch (error) {
    console.error('Error Check Payment Status:', error);
    return res.status(500).json({ message: 'Gagal melakukan verifikasi pembayaran.' });
  }
};

// -----------------------------------------------------------------------------
// 3. CALLBACK DARI FINPAY (verifikasi dengan cek status langsung ke Finpay)
// -----------------------------------------------------------------------------
exports.handleFinpayCallback = async (req, res) => {
  try {
    const orderCode = req.body?.order?.id;
    if (!orderCode) {
      return res.status(400).json({ responseCode: '4000000', responseMessage: 'Bad Request' });
    }

    // Jangan percaya isi callback begitu saja: tanya ulang ke Finpay.
    const info = await fetchFinpayStatus(orderCode);

    if (isPaidStatus(info?.result?.payment?.status)) {
      const row = await db.query('SELECT total_amount FROM orders WHERE order_code = $1', [orderCode]);
      if (
        row.rows.length &&
        Math.round(Number(row.rows[0].total_amount)) === Number(info?.order?.amount)
      ) {
        await markPaid(orderCode);
      }
    }

    return res.status(200).json({ responseCode: '2000000', responseMessage: 'Success' });
  } catch (error) {
    console.error('Callback error:', error.response?.data || error.message);
    return res.status(500).json({ responseCode: '5000000', responseMessage: 'Internal Server Error' });
  }
};