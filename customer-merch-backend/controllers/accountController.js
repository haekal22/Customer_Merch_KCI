const db = require('../db');

// 1. GET PROFILE & SUMMARY STATS ("Ringkasan Akun")
exports.getAccountSummary = async (req, res) => {
  const customerId = req.user.id;

  try {
    // A. Data Profil Customer
    const customerQuery = `
      SELECT id, name, email, phone, birth_date, created_at 
      FROM customers 
      WHERE id = $1;
    `;
    const customerRes = await db.query(customerQuery, [customerId]);

    if (customerRes.rows.length === 0) {
      return res.status(404).json({ message: 'Akun pelanggan tidak ditemukan.' });
    }

    const customer = customerRes.rows[0];

    // B. Alamat Utama Customer
    const addressQuery = `
      SELECT id, recipient_name, phone_number, full_address, district, city, province, postal_code, is_default
      FROM customer_addresses
      WHERE customer_id = $1
      ORDER BY is_default DESC, id DESC
      LIMIT 1;
    `;
    const addressRes = await db.query(addressQuery, [customerId]);

    // C. Hitung Counter Summary (Pesanan, Wishlist, Keranjang)
    const orderCountQuery = db.query('SELECT COUNT(*) FROM orders WHERE customer_id = $1;', [customerId]);
    const wishlistCountQuery = db.query('SELECT COUNT(*) FROM wishlists WHERE customer_id = $1;', [customerId]);
    const cartCountQuery = db.query('SELECT COALESCE(SUM(quantity), 0) as total FROM carts WHERE customer_id = $1;', [customerId]);

    const [orderCount, wishlistCount, cartCount] = await Promise.all([
      orderCountQuery,
      wishlistCountQuery,
      cartCountQuery
    ]);

    return res.status(200).json({
      profile: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        birth_date: customer.birth_date
      },
      stats: {
        total_orders: parseInt(orderCount.rows[0].count),
        total_wishlist: parseInt(wishlistCount.rows[0].count),
        total_cart_items: parseInt(cartCount.rows[0].total)
      },
      address: addressRes.rows[0] || null
    });

  } catch (error) {
    console.error('Error Get Account Summary:', error);
    return res.status(500).json({ message: 'Gagal memuat ringkasan akun.' });
  }
};

// 2. UPDATE PROFILE & ALAMAT PENGIRIMAN ("Simpan Perubahan")
exports.updateAccountProfile = async (req, res) => {
  const customerId = req.user.id;
  const { 
    name, 
    phone, 
    birth_date, 
    full_address, 
    district, 
    city, 
    province, 
    postal_code 
  } = req.body;

  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    // A. Update Data Diri Customer
    const updateCustomerQuery = `
      UPDATE customers 
      SET name = COALESCE($1, name),
          phone = COALESCE($2, phone),
          birth_date = COALESCE($3, birth_date),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, name, email, phone, birth_date;
    `;
    const updatedCustomer = await client.query(updateCustomerQuery, [name, phone, birth_date || null, customerId]);

    // B. Simpan / Update Alamat Pengiriman Utama
    if (full_address) {
      // Set alamat lama non-default
      await client.query('UPDATE customer_addresses SET is_default = false WHERE customer_id = $1', [customerId]);

      const upsertAddressQuery = `
        INSERT INTO customer_addresses (customer_id, recipient_name, phone_number, full_address, district, city, province, postal_code, is_default)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
        RETURNING *;
      `;

      await client.query(upsertAddressQuery, [
        customerId,
        name || updatedCustomer.rows[0].name,
        phone || updatedCustomer.rows[0].phone || '-',
        full_address,
        district || '',
        city || '',
        province || '',
        postal_code || ''
      ]);
    }

    await client.query('COMMIT');

    return res.status(200).json({
      message: 'Profil dan alamat pengiriman berhasil diperbarui!',
      profile: updatedCustomer.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error Update Account Profile:', error);
    return res.status(500).json({ message: 'Gagal memperbarui profil akun.' });
  } finally {
    client.release();
  }
};

// 3. LOGOUT USER
exports.logout = async (req, res) => {
  try {
    // Dengan JWT, stateless logout diselesaikan di sisi client dengan menghapus token dari Storage.
    return res.status(200).json({ message: 'Berhasil keluar dari akun.' });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal melakukan logout.' });
  }
};