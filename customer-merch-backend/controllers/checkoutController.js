const db = require('../db');

// 1. GET DATA CHECKOUT (Alamat Default, Cart Items, & Pilihan Kurir)
exports.getCheckoutInfo = async (req, res) => {
  const customerId = req.user.id;

  try {
    // A. Ambil Alamat Utama/Default Customer
    const addressQuery = `
      SELECT id, recipient_name, phone_number, full_address, province, city, district, postal_code, is_default
      FROM customer_addresses
      WHERE customer_id = $1
      ORDER BY is_default DESC, id DESC
      LIMIT 1;
    `;
    const addressRes = await db.query(addressQuery, [customerId]);

    // Jika belum ada alamat khusus di customer_addresses, gunakan data dasar dari tabel customers
    let selectedAddress = addressRes.rows[0] || null;
    if (!selectedAddress) {
      const custQuery = `SELECT id, name, email, phone FROM customers WHERE id = $1;`;
      const custRes = await db.query(custQuery, [customerId]);
      if (custRes.rows.length > 0) {
        const c = custRes.rows[0];
        selectedAddress = {
          recipient_name: c.name,
          phone_number: c.phone || '-',
          full_address: 'Alamat belum diatur. Silakan perbarui di profil akun.',
          email: c.email
        };
      }
    }

    // B. Ambil Items dari Keranjang Belanja
    const cartQuery = `
      SELECT 
        c.id as cart_id,
        c.quantity,
        p.id as product_id,
        p.name as product_name,
        p.price,
        p.image_url as product_image,
        pv.id as variant_id,
        pv.color_name,
        pv.size,
        (p.price * c.quantity) as subtotal
      FROM carts c
      JOIN products p ON c.product_id = p.id
      LEFT JOIN product_variants pv ON c.variant_id = pv.id
      WHERE c.customer_id = $1;
    `;
    const cartRes = await db.query(cartQuery, [customerId]);

    if (cartRes.rows.length === 0) {
      return res.status(400).json({ message: 'Keranjang belanja Anda kosong.' });
    }

    const items = cartRes.rows;
    const subtotal = items.reduce((sum, item) => sum + Number(item.subtotal), 0);

    // C. Opsi Kurir & Layanan Pengiriman (Mock/Standard Data)
    const couriers = [
      {
        id: 'jne',
        name: 'JNE',
        description: 'Jaringan pengiriman terluas di Indonesia',
        services: [
          { code: 'REG', name: 'JNE Reguler', etd: 'Estimasi Tiba 2 - 3 hari kerja', cost: 12000 },
          { code: 'YES', name: 'JNE Express', etd: 'Estimasi tiba 1 hari kerja', cost: 28000 }
        ]
      },
      {
        id: 'sicepat',
        name: 'SiCepat',
        description: 'Pengiriman cepat dengan jangkauan luas',
        services: [
          { code: 'REG', name: 'SiCepat Reguler', etd: 'Estimasi Tiba 2 - 4 hari kerja', cost: 11000 },
          { code: 'BEST', name: 'SiCepat Express', etd: 'Estimasi tiba 1 hari kerja', cost: 25000 }
        ]
      },
      {
        id: 'jnt',
        name: 'J&T',
        description: 'Pengiriman harian ke seluruh Indonesia',
        services: [
          { code: 'EZ', name: 'J&T Reguler', etd: 'Estimasi Tiba 2 - 3 hari kerja', cost: 13000 },
          { code: 'EXPRESS', name: 'J&T Express', etd: 'Estimasi tiba 1 hari kerja', cost: 26000 }
        ]
      },
      {
        id: 'anteraja',
        name: 'AnterAja',
        description: 'Pengiriman fleksibel dengan opsi sameday',
        services: [
          { code: 'REG', name: 'AnterAja Reguler', etd: 'Estimasi Tiba 2 - 4 hari kerja', cost: 11000 },
          { code: 'NEXTDAY', name: 'AnterAja Express', etd: 'Estimasi tiba 1 hari kerja', cost: 25000 }
        ]
      }
    ];

    return res.status(200).json({
      address: selectedAddress,
      cart_items: items,
      subtotal: subtotal,
      couriers: couriers
    });

  } catch (error) {
    console.error('Error Checkout Info:', error);
    return res.status(500).json({ message: 'Gagal mengambil informasi checkout.' });
  }
};

// 2. PROCESS PLACE ORDER ("Buat Pesanan")
exports.createOrder = async (req, res) => {
  const customerId = req.user.id;
  const { 
    address_id, 
    shipping_courier, 
    shipping_service, 
    shipping_cost, 
    payment_method = 'QRIS' 
  } = req.body;

  try {
    // A. Ambil Cart Items
    const cartQuery = `
      SELECT c.*, p.price, p.name as product_name
      FROM carts c
      JOIN products p ON c.product_id = p.id
      WHERE c.customer_id = $1;
    `;
    const cartRes = await db.query(cartQuery, [customerId]);

    if (cartRes.rows.length === 0) {
      return res.status(400).json({ message: 'Keranjang belanja kosong.' });
    }

    const cartItems = cartRes.rows;
    const subtotal = cartItems.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
    const costShipping = Number(shipping_cost) || 0;
    const totalAmount = subtotal + costShipping;

    // B. Format Alamat Pengiriman
    let shippingAddressText = '';
    if (address_id) {
      const addrRes = await db.query('SELECT * FROM customer_addresses WHERE id = $1', [address_id]);
      if (addrRes.rows.length > 0) {
        const a = addrRes.rows[0];
        shippingAddressText = `${a.recipient_name} (${a.phone_number}) - ${a.full_address}, ${a.district}, ${a.city}, ${a.province} ${a.postal_code}`;
      }
    }

    if (!shippingAddressText) {
      const custRes = await db.query('SELECT name, email, phone FROM customers WHERE id = $1', [customerId]);
      const c = custRes.rows[0];
      shippingAddressText = `${c.name} (${c.phone || '-'}) - Alamat Utama`;
    }

    // C. Generate Kode Pesanan Unik (misal: CM20260930XXX)
    const orderCode = `CM${Date.now().toString().slice(-8)}`;

    // D. Simpan ke Tabel `orders` (Tersinkron dengan Admin Panel)
    const insertOrderQuery = `
      INSERT INTO orders (
        customer_id, customer_name, order_code, total_amount, 
        payment_method, status, shipping_courier, shipping_service, 
        shipping_cost, shipping_address, created_at
      )
      VALUES (
        $1, (SELECT name FROM customers WHERE id = $1), $2, $3, 
        $4, 'Menunggu Pembayaran', $5, $6, $7, $8, CURRENT_TIMESTAMP
      )
      RETURNING *;
    `;

    const orderRes = await db.query(insertOrderQuery, [
      customerId,
      orderCode,
      totalAmount,
      payment_method,
      shipping_courier,
      shipping_service,
      costShipping,
      shippingAddressText
    ]);

    const createdOrder = orderRes.rows[0];

    // E. Simpan Rincian Item ke `order_items`
    for (const item of cartItems) {
      const insertItemQuery = `
        INSERT INTO order_items (order_id, product_id, variant_id, quantity, price)
        VALUES ($1, $2, $3, $4, $5);
      `;
      await db.query(insertItemQuery, [
        createdOrder.id,
        item.product_id,
        item.variant_id || null,
        item.quantity,
        item.price
      ]);
    }

    // F. Kosongkan Keranjang Belanja Customer
    await db.query('DELETE FROM carts WHERE customer_id = $1;', [customerId]);

    return res.status(201).json({
      message: 'Pesanan berhasil dibuat!',
      order: {
        id: createdOrder.id,
        order_code: createdOrder.order_code,
        total_amount: createdOrder.total_amount,
        status: createdOrder.status,
        payment_method: createdOrder.payment_method
      }
    });

  } catch (error) {
    console.error('Error Create Order:', error);
    return res.status(500).json({ message: 'Gagal memproses pesanan.' });
  }
};