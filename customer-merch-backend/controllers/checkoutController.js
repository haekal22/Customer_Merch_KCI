const db = require('../db');
const axios = require('axios');
const https = require('https');

// Custom Agent IPv4 untuk mencegah socket timeout pada koneksi lokal
const httpsAgent = new https.Agent({
  family: 4,
  keepAlive: true
});

// -----------------------------------------------------------------------------
// 1. GET DATA CHECKOUT (Alamat Customer & Item Keranjang Belanja)
// -----------------------------------------------------------------------------
exports.getCheckoutInfo = async (req, res) => {
  const customerId = req.user.id;

  try {
    const addressQuery = `
      SELECT id, recipient_name, phone_number, full_address, province, city, district, postal_code, destination_id, is_default
      FROM customer_addresses
      WHERE customer_id = $1
      ORDER BY is_default DESC, id DESC
      LIMIT 1;
    `;
    const addressRes = await db.query(addressQuery, [customerId]);

    let selectedAddress = addressRes.rows[0] || null;

    if (selectedAddress) {
      selectedAddress.city_id = selectedAddress.destination_id || 17601;
    } else {
      const custQuery = `SELECT id, name, email, phone FROM customers WHERE id = $1;`;
      const custRes = await db.query(custQuery, [customerId]);
      if (custRes.rows.length > 0) {
        const c = custRes.rows[0];
        selectedAddress = {
          recipient_name: c.name,
          phone_number: c.phone || '-',
          full_address: 'Alamat belum diatur. Silakan perbarui di profil akun.',
          email: c.email,
          city_id: 17601
        };
      }
    }

    const cartQuery = `
      SELECT 
        c.id as cart_id,
        c.quantity,
        p.id as product_id,
        p.name as product_name,
        p.price,
        p.image_url as product_image,
        pv.id as variant_id,
        pv.color as color_name,
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

    return res.status(200).json({
      address: selectedAddress,
      cart_items: items,
      subtotal: subtotal
    });

  } catch (error) {
    console.error('Error Checkout Info:', error);
    return res.status(500).json({ message: 'Gagal mengambil informasi checkout.' });
  }
};

// -----------------------------------------------------------------------------
// 2. CALCULATE SHIPPING COST DINAMIS (KOMERCE V1 WITH USER-FRIENDLY MAPPING)
// -----------------------------------------------------------------------------
exports.calculateShipping = async (req, res) => {
  const { destination_city_id, weight_grams = 1000, courier } = req.body;

  const courierCode = (courier || 'jne').toLowerCase();
  const apiKey = process.env.KOMERCE_API_KEY;
  const originSubdistrict = process.env.KOMERCE_ORIGIN_CITY || '17602';
  const destinationSubdistrict = destination_city_id || 17601;

  try {
    const params = new URLSearchParams({
      origin: String(originSubdistrict),
      destination: String(destinationSubdistrict),
      weight: String(weight_grams),
      courier: courierCode
    });

    const response = await axios.post(
      'https://rajaongkir.komerce.id/api/v1/calculate/domestic-cost',
      params.toString(),
      {
        headers: {
          'key': apiKey,
          'content-type': 'application/x-www-form-urlencoded'
        },
        httpsAgent: httpsAgent,
        timeout: 6000
      }
    );

    const rawData = response.data?.data || response.data?.results || [];

    if (Array.isArray(rawData) && rawData.length > 0) {
      const filteredData = rawData.filter((c) => {
        const serviceName = (c.service || c.service_name || '').toUpperCase();
        return !serviceName.includes('<') && !serviceName.includes('>') && !serviceName.includes('JTR');
      });

      const displayData = filteredData.length > 0 ? filteredData : rawData.slice(0, 3);

      const services = displayData.map((c, index) => {
        const serviceCode = (c.service || c.service_name || `SERVICE_${index + 1}`).toUpperCase();

        let friendlyName = `${courierCode.toUpperCase()} ${serviceCode}`;
        if (serviceCode === 'CTC' || serviceCode === 'REG') {
          friendlyName = `${courierCode.toUpperCase()} Reguler`;
        } else if (serviceCode === 'CTCYES' || serviceCode === 'YES') {
          friendlyName = `${courierCode.toUpperCase()} Express (YES)`;
        } else if (serviceCode === 'CTCPS' || serviceCode === 'SS') {
          friendlyName = `${courierCode.toUpperCase()} Instant / Super Speed`;
        } else if (serviceCode === 'OKE') {
          friendlyName = `${courierCode.toUpperCase()} Economical (OKE)`;
        }

        let extractedPrice = 0;
        if (typeof c.tariff === 'number' && c.tariff > 0) extractedPrice = c.tariff;
        else if (typeof c.price === 'number' && c.price > 0) extractedPrice = c.price;
        else if (typeof c.cost === 'number' && c.cost > 0) extractedPrice = c.cost;
        else if (Array.isArray(c.costs) && c.costs[0]?.value) extractedPrice = Number(c.costs[0].value);
        else if (Array.isArray(c.cost) && c.cost[0]?.value) extractedPrice = Number(c.cost[0].value);
        else if (typeof c.grandtotal === 'number' && c.grandtotal > 0) extractedPrice = c.grandtotal;

        if (!extractedPrice || extractedPrice === 0) {
          extractedPrice = 10000 + (index * 8000);
        }

        const rawEtd = c.etd || (Array.isArray(c.cost) ? c.cost[0]?.etd : '') || (Array.isArray(c.costs) ? c.costs[0]?.etd : '') || '';
        let formattedEtd = 'Estimasi 1-3 hari kerja';

        if (rawEtd) {
          const cleanEtd = String(rawEtd)
            .toUpperCase()
            .replace(/DAY/g, '')
            .replace(/HARI/g, '')
            .replace(/KERJA/g, '')
            .trim();

          if (cleanEtd === '0') {
            formattedEtd = 'Estimasi Tiba Hari Ini (Same Day)';
          } else {
            formattedEtd = `Estimasi Tiba ${cleanEtd} hari kerja`;
          }
        }

        return {
          id: `${courierCode}_${serviceCode.toLowerCase().replace(/\s+/g, '_')}`,
          service_code: serviceCode,
          name: friendlyName,
          description: c.description || `Layanan Pengiriman ${friendlyName}`,
          estimation: formattedEtd,
          price: Number(extractedPrice)
        };
      });

      return res.status(200).json({
        courier_code: courierCode,
        services: services
      });
    }

    throw new Error('Data layanan ongkir Komerce kosong');

  } catch (error) {
    console.error('Error Komerce API:', error.response?.data || error.message);

    return res.status(200).json({
      courier_code: courierCode,
      services: [
        {
          id: `${courierCode}_reg`,
          service_code: 'REG',
          name: `${courierCode.toUpperCase()} Reguler`,
          description: `Pengiriman Reguler via ${courierCode.toUpperCase()}`,
          estimation: 'Estimasi Tiba 1 - 2 hari kerja',
          price: 10000
        },
        {
          id: `${courierCode}_yes`,
          service_code: 'YES',
          name: `${courierCode.toUpperCase()} Express (YES)`,
          description: `Pengiriman Cepat via ${courierCode.toUpperCase()}`,
          estimation: 'Estimasi Tiba 1 hari kerja',
          price: 18000
        }
      ]
    });
  }
};

// -----------------------------------------------------------------------------
// 3. PROCESS PLACE ORDER ("Buat Pesanan" - REDIRECT KE PAYMENT PAGE)
// -----------------------------------------------------------------------------
exports.createOrder = async (req, res) => {
  const customerId = req.user.id;
  const { 
    address_id, 
    shipping_courier, 
    shipping_service, 
    shipping_cost, 
    payment_method = 'Finpay QRIS' 
  } = req.body;

  try {
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

    const custRes = await db.query('SELECT id, name, email, phone FROM customers WHERE id = $1', [customerId]);
    const customer = custRes.rows[0] || { name: 'Customer C-Merch', email: 'customer@cmerch.id', phone: '085926944122' };

    let shippingAddressText = '';
    if (address_id) {
      const addrRes = await db.query('SELECT * FROM customer_addresses WHERE id = $1', [address_id]);
      if (addrRes.rows.length > 0) {
        const a = addrRes.rows[0];
        shippingAddressText = `${a.recipient_name} (${a.phone_number}) - ${a.full_address}, ${a.district}, ${a.city}, ${a.province} ${a.postal_code}`;
      }
    }

    if (!shippingAddressText) {
      shippingAddressText = `${customer.name} (${customer.phone || '-'}) - Alamat Utama`;
    }

    const orderCode = `CM${Date.now().toString().slice(-8)}`;

    const insertOrderQuery = `
      INSERT INTO orders (
        customer_id, total_amount, status, created_at, 
        order_code, payment_method, shipping_courier, 
        shipping_service, shipping_cost, shipping_address
      )
      VALUES (
        $1, $2, 'pending', CURRENT_TIMESTAMP, 
        $3, $4, $5, $6, $7, $8
      )
      RETURNING *;
    `;

    const orderRes = await db.query(insertOrderQuery, [
      customerId,
      totalAmount,
      orderCode,
      payment_method,
      shipping_courier,
      shipping_service,
      costShipping,
      shippingAddressText
    ]);

    const createdOrder = orderRes.rows[0];

    for (const item of cartItems) {
      const insertItemQuery = `
        INSERT INTO order_items (order_id, product_variant_id, quantity, price)
        VALUES ($1, $2, $3, $4);
      `;
      await db.query(insertItemQuery, [
        createdOrder.id,
        item.variant_id || item.product_id,
        item.quantity,
        item.price
      ]);
    }

    // Kosongkan Keranjang Belanja Customer
    await db.query('DELETE FROM carts WHERE customer_id = $1;', [customerId]);

    return res.status(201).json({
      message: 'Pesanan berhasil dibuat!',
      order: {
        id: createdOrder.id,
        order_code: createdOrder.order_code,
        total_amount: createdOrder.total_amount,
        status: createdOrder.status
      }
    });

  } catch (error) {
    console.error('Error Create Order:', error);
    return res.status(500).json({ message: 'Gagal memproses pesanan.' });
  }
};

// -----------------------------------------------------------------------------
// 4. HANDLER DEMO: UBAH STATUS ORDER MENJADI 'paid' (SIMULASI SCAN QRIS)
// -----------------------------------------------------------------------------
exports.payDemoOrder = async (req, res) => {
  const { id } = req.params;

  try {
    await db.query(
      "UPDATE orders SET status = 'paid' WHERE id = $1",
      [id]
    );

    return res.status(200).json({ message: 'Pembayaran demo berhasil!' });
  } catch (error) {
    console.error('Error pay demo:', error);
    return res.status(500).json({ message: 'Gagal memproses pembayaran demo.' });
  }
};