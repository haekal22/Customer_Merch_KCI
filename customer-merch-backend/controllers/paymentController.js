const db = require('../db');

// 1. GET PAYMENT DETAIL FOR ORDER (Tampilan QRIS & Timer)
exports.getPaymentDetail = async (req, res) => {
  const customerId = req.user.id;
  const { order_id } = req.params;

  try {
    // Ambil Data Order milik Customer
    const orderQuery = `
      SELECT id, order_code, total_amount, status, payment_method, 
             shipping_cost, shipping_courier, shipping_service, created_at
      FROM orders
      WHERE (id = $1 OR order_code = $1) AND customer_id = $2;
    `;
    const orderRes = await db.query(orderQuery, [order_id, customerId]);

    if (orderRes.rows.length === 0) {
      return res.status(404).json({ message: 'Pesanan tidak ditemukan.' });
    }

    const order = orderRes.rows[0];

    // Ambil Items dalam Pesanan
    const itemsQuery = `
      SELECT oi.quantity, oi.price, p.name as product_name, p.image_url, pv.color_name, pv.size
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      LEFT JOIN product_variants pv ON oi.variant_id = pv.id
      WHERE oi.order_id = $1;
    `;
    const itemsRes = await db.query(itemsQuery, [order.id]);

    // Hitung sisa waktu pembayaran (24 jam dari created_at)
    const createdAtTime = new Date(order.created_at).getTime();
    const expiryTime = createdAtTime + (24 * 60 * 60 * 1000); // +24 Jam
    const currentTime = Date.now();
    const timeRemainingSeconds = Math.max(0, Math.floor((expiryTime - currentTime) / 1000));

    // String Data QRIS (Mock Standard QRIS Payload)
    const qrisPayload = `00020101021226680016ID.CO.QRIS.WWW011893600911002123456702150000${order.order_code}520458125303360540${order.total_amount}5802ID5920C-Merch Official Store6007Jakarta6304ABCD`;

    return res.status(200).json({
      order_id: order.id,
      order_code: order.order_code,
      merchant_name: 'C-Merch Official Store',
      total_amount: Number(order.total_amount),
      status: order.status,
      created_at: order.created_at,
      time_remaining_seconds: timeRemainingSeconds,
      qris_data: {
        payload: qrisPayload,
        // URL QR Code Image Generator menggunakan API Public QuickChart/Google
        qr_image_url: `https://quickchart.io/qr?text=${encodeURIComponent(qrisPayload)}&size=300`
      },
      order_items: itemsRes.rows,
      subtotal: Number(order.total_amount) - Number(order.shipping_cost || 0),
      shipping_cost: Number(order.shipping_cost || 0),
      shipping_courier: order.shipping_courier
    });

  } catch (error) {
    console.error('Error Get Payment Detail:', error);
    return res.status(500).json({ message: 'Gagal mengambil detail pembayaran.' });
  }
};

// 2. VERIFIKASI / CEK STATUS PEMBAYARAN AUTOMATIS ("Cek Status Pembayaran otomatis")
exports.checkPaymentStatus = async (req, res) => {
  const customerId = req.user.id;
  const { order_id } = req.params;

  try {
    const orderQuery = `
      SELECT id, order_code, total_amount, status 
      FROM orders 
      WHERE (id = $1 OR order_code = $1) AND customer_id = $2;
    `;
    const orderRes = await db.query(orderQuery, [order_id, customerId]);

    if (orderRes.rows.length === 0) {
      return res.status(404).json({ message: 'Pesanan tidak ditemukan.' });
    }

    const order = orderRes.rows[0];

    // Jika pesanan sudah dibayar sebelumnya
    if (order.status === 'Sudah Dibayar' || order.status === 'Pesanan Diproses') {
      return res.status(200).json({
        is_paid: true,
        message: 'Pembayaran Terdeteksi & Berhasil',
        order_code: order.order_code,
        total_amount: Number(order.total_amount),
        status: order.status
      });
    }

    // Simulasi Cek Mutasi Bank / QRIS Gateway (Mock Logic Verifikasi Pembayaran)
    // Dalam simulasi ini, 80% verifikasi berhasil ketika user menekan tombol
    const now = new Date();
    const formattedTime = now.toTimeString().split(' ')[0]; // HH:MM:SS

    // Skenario simulasi pembayaran terdeteksi
    const isPaymentDetected = req.body.force_success || Math.random() > 0.3; 

    if (isPaymentDetected) {
      // Update Status Order di Database ke "Sudah Dibayar"
      const updateOrderQuery = `
        UPDATE orders 
        SET status = 'Sudah Dibayar', updated_at = CURRENT_TIMESTAMP 
        WHERE id = $1 RETURNING *;
      `;
      await db.query(updateOrderQuery, [order.id]);

      return res.status(200).json({
        is_paid: true,
        message: 'Pembayaran Terdeteksi & Berhasil',
        order_code: order.order_code,
        total_amount: Number(order.total_amount),
        checked_at: formattedTime
      });
    } else {
      // Pembayaran belum masuk/terdeteksi
      return res.status(200).json({
        is_paid: false,
        message: 'Pembayaran belum terdeteksi',
        checked_at: formattedTime,
        detail_note: `Terakhir diperiksa pukul ${formattedTime}. Transfer biasanya terverifikasi otomatis dalam 1-3 menit setelah dana kami terima.`
      });
    }

  } catch (error) {
    console.error('Error Check Payment Status:', error);
    return res.status(500).json({ message: 'Gagal melakukan verifikasi pembayaran.' });
  }
};