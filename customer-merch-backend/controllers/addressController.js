const db = require('../db');
const axios = require('axios');
const https = require('https');

const httpsAgent = new https.Agent({ family: 4, keepAlive: true });

// 1. GET ALL ADDRESSES / DEFAULT ADDRESS FOR CUSTOMER
exports.getAddresses = async (req, res) => {
  const customerId = req.user.id;
  try {
    const result = await db.query(
      'SELECT * FROM customer_addresses WHERE customer_id = $1 ORDER BY is_default DESC, id DESC LIMIT 1',
      [customerId]
    );
    return res.status(200).json(result.rows[0] || null);
  } catch (error) {
    console.error('Error Get Address:', error);
    return res.status(500).json({ message: 'Gagal mengambil data alamat.' });
  }
};

// 2. SAVE OR UPDATE ADDRESS (DENGAN DESTINATION ID)
exports.addAddress = async (req, res) => {
  const customerId = req.user.id;
  const { 
    recipient_name, 
    phone_number, 
    full_address, 
    province, 
    city, 
    district, 
    postal_code, 
    destination_id, 
    is_default = true 
  } = req.body;

  try {
    // Reset status default alamat lain milik customer
    await db.query('UPDATE customer_addresses SET is_default = false WHERE customer_id = $1', [customerId]);

    // Cek apakah alamat sudah pernah diisi
    const checkQuery = await db.query('SELECT id FROM customer_addresses WHERE customer_id = $1 LIMIT 1', [customerId]);

    let result;
    if (checkQuery.rows.length > 0) {
      // UPDATE ALAMAT LAMA
      const updateQuery = `
        UPDATE customer_addresses 
        SET recipient_name = $1, phone_number = $2, full_address = $3, 
            province = $4, city = $5, district = $6, postal_code = $7, 
            destination_id = $8, is_default = $9
        WHERE id = $10 AND customer_id = $11
        RETURNING *;
      `;
      result = await db.query(updateQuery, [
        recipient_name, phone_number, full_address, 
        province, city, district, postal_code, 
        destination_id || 17601, is_default, 
        checkQuery.rows[0].id, customerId
      ]);
    } else {
      // INSERT ALAMAT BARU
      const insertQuery = `
        INSERT INTO customer_addresses (
          customer_id, recipient_name, phone_number, full_address, 
          province, city, district, postal_code, destination_id, is_default
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *;
      `;
      result = await db.query(insertQuery, [
        customerId, recipient_name, phone_number, full_address, 
        province, city, district, postal_code, 
        destination_id || 17601, is_default
      ]);
    }

    return res.status(200).json({ 
      message: 'Alamat pengiriman berhasil disimpan!', 
      address: result.rows[0] 
    });

  } catch (error) {
    console.error('Error Save Address:', error);
    return res.status(500).json({ message: 'Gagal menyimpan alamat.' });
  }
};

// 3. SEARCH DESTINATION KOMERCE API
exports.searchDestination = async (req, res) => {
  const { search } = req.query;

  if (!search || search.trim().length < 3) {
    return res.status(400).json({ message: 'Minimal masukkan 3 karakter untuk pencarian.' });
  }

  try {
    const apiKey = process.env.KOMERCE_API_KEY;

    const response = await axios.get(
      `https://rajaongkir.komerce.id/api/v1/destination/domestic-destination?search=${encodeURIComponent(search.trim())}`,
      {
        headers: { 'key': apiKey },
        httpsAgent: httpsAgent,
        timeout: 6000
      }
    );

    const rawDestinations = response.data?.data || response.data?.results || [];

    const formattedData = rawDestinations.map((item) => ({
      destination_id: item.id,
      label: item.label || `${item.subdistrict_name}, ${item.city_name}, ${item.province_name}`,
      subdistrict_name: item.subdistrict_name,
      city_name: item.city_name,
      province_name: item.province_name,
      zip_code: item.zip_code
    }));

    return res.status(200).json({
      success: true,
      total: formattedData.length,
      data: formattedData
    });

  } catch (error) {
    console.error('Error Search Destination:', error.response?.data || error.message);
    return res.status(200).json({
      success: true,
      data: [
        {
          destination_id: 17602,
          label: 'KEBON KELAPA, GAMBIR, JAKARTA PUSAT, DKI JAKARTA, 10120',
          subdistrict_name: 'KEBON KELAPA',
          city_name: 'JAKARTA PUSAT',
          province_name: 'DKI JAKARTA',
          zip_code: '10120'
        },
        {
          destination_id: 17601,
          label: 'GAMBIR, GAMBIR, JAKARTA PUSAT, DKI JAKARTA, 10110',
          subdistrict_name: 'GAMBIR',
          city_name: 'JAKARTA PUSAT',
          province_name: 'DKI JAKARTA',
          zip_code: '10110'
        }
      ]
    });
  }
};