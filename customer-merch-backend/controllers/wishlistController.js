const db = require('../db');

// 1. GET ALL WISHLIST ITEMS
exports.getWishlist = async (req, res) => {
  const customerId = req.user.id;

  try {
    const query = `
      SELECT 
        w.id as wishlist_id,
        p.id as product_id,
        p.name as product_name,
        p.price,
        p.image_url,
        COUNT(pv.id) as variant_count
      FROM wishlists w
      JOIN products p ON w.product_id = p.id
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      WHERE w.customer_id = $1
      GROUP BY w.id, p.id
      ORDER BY w.created_at DESC;
    `;

    const result = await db.query(query, [customerId]);
    return res.status(200).json({
      total: result.rows.length,
      wishlist: result.rows
    });
  } catch (error) {
    console.error('Error Get Wishlist:', error);
    return res.status(500).json({ message: 'Gagal mengambil data wishlist.' });
  }
};

// 2. TOGGLE WISHLIST (ADD / REMOVE)
exports.toggleWishlist = async (req, res) => {
  const customerId = req.user.id;
  const { product_id } = req.body;

  try {
    if (!product_id) {
      return res.status(400).json({ message: 'Product ID wajib diisi.' });
    }

    // Cek apakah sudah ada di wishlist
    const check = await db.query('SELECT * FROM wishlists WHERE customer_id = $1 AND product_id = $2', [customerId, product_id]);

    if (check.rows.length > 0) {
      // Hapus jika sudah ada
      await db.query('DELETE FROM wishlists WHERE id = $1', [check.rows[0].id]);
      return res.status(200).json({ is_wishlist: false, message: 'Dihapus dari wishlist.' });
    } else {
      // Tambahkan jika belum ada
      await db.query('INSERT INTO wishlists (customer_id, product_id) VALUES ($1, $2)', [customerId, product_id]);
      return res.status(200).json({ is_wishlist: true, message: 'Ditambahkan ke wishlist!' });
    }
  } catch (error) {
    console.error('Error Toggle Wishlist:', error);
    return res.status(500).json({ message: 'Gagal memperbarui wishlist.' });
  }
};