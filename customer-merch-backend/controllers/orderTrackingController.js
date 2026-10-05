const db = require('../db');
const courierService = require('../services/courierService');

// 1. GET DAFTAR RIWAYAT PESANAN CUSTOMER ("Pesanan Saya")
exports.getMyOrders = async (req, res) => {
  const customerId = req.user.id;
  const { status } = req.query;

  try {
    let query = `
      SELECT o.id, o.order_code, o.total_amount, o.status, o.created_at,
             COUNT(oi.id) as total_items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.customer_id = $1
    `;
    const queryParams = [customerId];

    if (status && status !== 'Semua') {
      queryParams.push(status);
      query += ` AND LOWER(o.status) = LOWER($2)`;
    }

    query += ` GROUP BY o.id ORDER BY o.created_at DESC;`;

    const result = await db.query(query, queryParams);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error Get My Orders:', error);
    return res.status(500).json({ message: 'Gagal mengambil riwayat pesanan.' });
  }
};

// 2. GET TRACKING & DETAIL PESANAN UNTUK CUSTOMER
exports.trackOrder = async (req, res) => {
  const customerId = req.user.id;
  const { order_id } = req.params;

  try {
    const orderQuery = `
      SELECT 
        o.id, 
        o.order_code, 
        o.total_amount, 
        o.status, 
        o.payment_method, 
        o.shipping_courier, 
        o.shipping_service, 
        o.shipping_cost, 
        o.shipping_address, 
        o.tracking_number,
        o.courier_code,
        o.courier_tracking_data,
        o.is_manual_override,
        o.last_tracking_sync,
        o.created_at, 
        o.updated_at
      FROM orders o
      WHERE (o.id::text = $1 OR o.order_code = $1) AND o.customer_id = $2;
    `;
    const orderRes = await db.query(orderQuery, [order_id, customerId]);

    if (orderRes.rows.length === 0) {
      return res.status(404).json({ message: 'Pesanan tidak ditemukan.' });
    }

    let order = orderRes.rows[0];

    // Auto-sync Kurir jika status 'Pesanan Dikirim' & tidak di-override manual
    if (
      order.status === 'Pesanan Dikirim' && 
      order.tracking_number && 
      !order.is_manual_override
    ) {
      const now = new Date();
      const lastSync = order.last_tracking_sync ? new Date(order.last_tracking_sync) : new Date(0);
      const diffMinutes = Math.floor((now - lastSync) / (1000 * 60));

      if (diffMinutes >= 30 || !order.courier_tracking_data) {
        const courierCode = order.courier_code || order.shipping_courier || 'jne';
        const trackingResult = await courierService.fetchCourierTracking(courierCode, order.tracking_number);

        if (trackingResult.success) {
          let updatedStatus = order.status;
          if (trackingResult.delivered) {
            updatedStatus = 'Pesanan Diterima';
          }

          const updateQuery = `
            UPDATE orders 
            SET courier_tracking_data = $1, 
                status = $2,
                last_tracking_sync = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING *;
          `;
          const updatedRes = await db.query(updateQuery, [
            JSON.stringify(trackingResult.history),
            updatedStatus,
            order.id
          ]);
          
          order = updatedRes.rows[0];
        }
      }
    }

    const itemsQuery = `
      SELECT 
        oi.quantity, 
        oi.price, 
        p.id as product_id, 
        p.name as product_name, 
        p.image_url, 
        pv.color_name, 
        pv.size
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      LEFT JOIN product_variants pv ON oi.variant_id = pv.id
      WHERE oi.order_id = $1;
    `;
    const itemsRes = await db.query(itemsQuery, [order.id]);

    const statusOrderMap = ['Menunggu Pembayaran', 'Sudah Dibayar', 'Pesanan Diproses', 'Pesanan Dikirim', 'Pesanan Diterima'];
    const currentStatusIndex = statusOrderMap.indexOf(order.status);

    const trackingLogs = order.courier_tracking_data || [
      { title: 'Paket diserahkan ke kurir', location: 'Gudang C-Merch', status: 'Selesai' },
      { title: 'Paket dalam perjalanan menuju kota tujuan', location: 'In Transit', status: 'In Transit' }
    ];

    const timeline = [
      {
        step: 'Menunggu Pembayaran',
        completed: currentStatusIndex >= 0,
        active: order.status === 'Menunggu Pembayaran',
        timestamp: order.created_at
      },
      {
        step: 'Sudah Dibayar',
        completed: currentStatusIndex >= 1,
        active: order.status === 'Sudah Dibayar',
        timestamp: currentStatusIndex >= 1 ? order.updated_at : null
      },
      {
        step: 'Pesanan Diproses',
        completed: currentStatusIndex >= 2,
        active: order.status === 'Pesanan Diproses',
        timestamp: currentStatusIndex >= 2 ? order.updated_at : null,
        sub_steps: [
          { title: 'Pesanan Diverifikasi', status: currentStatusIndex >= 2 ? 'Selesai' : 'Pending' },
          { title: 'Barang disiapkan dari gudang', status: currentStatusIndex >= 2 ? 'Selesai' : 'Pending' },
          { title: 'Pemeriksaan kualitas (QC)', status: currentStatusIndex >= 2 ? 'Selesai' : 'Pending' },
          { title: 'Dikemas & siap diserahkan ke kurir', status: currentStatusIndex >= 2 ? 'Selesai' : 'Pending' }
        ]
      },
      {
        step: 'Pesanan Dikirim',
        completed: currentStatusIndex >= 3,
        active: order.status === 'Pesanan Dikirim',
        timestamp: currentStatusIndex >= 3 ? order.updated_at : null,
        tracking_info: {
          courier: `${order.shipping_courier || 'JNE'} - ${order.shipping_service || 'Reguler'}`,
          waybill_number: order.tracking_number || '-',
          logs: trackingLogs
        }
      },
      {
        step: 'Pesanan Diterima',
        completed: currentStatusIndex >= 4,
        active: order.status === 'Pesanan Diterima',
        timestamp: currentStatusIndex >= 4 ? order.updated_at : null,
        recipient_info: currentStatusIndex >= 4 ? {
          received_by: req.user.name || 'Pelanggan',
          address: order.shipping_address,
          note: 'Paket telah diterima dengan baik di alamat tujuan. Terima kasih telah berbelanja di C-Merch!'
        } : null
      }
    ];

    return res.status(200).json({
      order_id: order.id,
      order_code: order.order_code,
      current_status: order.status,
      is_manual_override: order.is_manual_override,
      created_at: order.created_at,
      payment_method: order.payment_method,
      shipping: {
        courier: order.shipping_courier,
        service: order.shipping_service,
        cost: Number(order.shipping_cost || 0),
        address: order.shipping_address,
        tracking_number: order.tracking_number
      },
      total_amount: Number(order.total_amount),
      items: itemsRes.rows,
      timeline: timeline
    });

  } catch (error) {
    console.error('Error Track Order API:', error);
    return res.status(500).json({ message: 'Gagal memuat lacak pesanan.' });
  }
};