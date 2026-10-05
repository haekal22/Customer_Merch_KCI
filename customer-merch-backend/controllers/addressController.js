const db = require('../db');

// 1. GET ALL ADDRESSES FOR CUSTOMER
exports.getAddresses = async (req, res) => {
  const customerId = req.user.id;
  try {
    const result = await db.query(
      'SELECT * FROM customer_addresses WHERE customer_id = $1 ORDER BY is_default DESC, id DESC',
      [customerId]
    );
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error Get Addresses:', error);
    return res.status(500).json({ message: 'Gagal mengambil daftar alamat.' });
  }
};

// 2. ADD NEW ADDRESS
exports.addAddress = async (req, res) => {
  const customerId = req.user.id;
  const { recipient_name, phone_number, full_address, province, city, district, postal_code, is_default } = req.body;

  try {
    if (is_default) {
      await db.query('UPDATE customer_addresses SET is_default = false WHERE customer_id = $1', [customerId]);
    }

    const query = `
      INSERT INTO customer_addresses (customer_id, recipient_name, phone_number, full_address, province, city, district, postal_code, is_default)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;
    const result = await db.query(query, [
      customerId, recipient_name, phone_number, full_address, 
      province, city, district, postal_code, is_default || false
    ]);

    return res.status(201).json({ message: 'Alamat berhasil ditambahkan!', address: result.rows[0] });
  } catch (error) {
    console.error('Error Add Address:', error);
    return res.status(500).json({ message: 'Gagal menambahkan alamat.' });
  }
};