const db = require('../db');

// 1. GET ALL CART ITEMS FOR LOGGED-IN CUSTOMER
exports.getCart = async (req, res) => {
  const customerId = req.user.id;

  try {
    const query = `
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
      WHERE c.customer_id = $1
      ORDER BY c.created_at DESC;
    `;

    const result = await db.query(query, [customerId]);
    const cartItems = result.rows;

    // Hitung ringkasan belanja
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cartItems.reduce((sum, item) => sum + Number(item.subtotal), 0);

    return res.status(200).json({
      cart: cartItems,
      summary: {
        total_items: totalItems,
        subtotal: subtotal,
        total: subtotal
      }
    });
  } catch (error) {
    console.error('Error Get Cart:', error);
    return res.status(500).json({ message: 'Gagal mengambil data keranjang.' });
  }
};

// 2. ADD ITEM TO CART
exports.addToCart = async (req, res) => {
  const customerId = req.user.id;
  const { product_id, variant_id, quantity = 1 } = req.body;

  try {
    if (!product_id) {
      return res.status(400).json({ message: 'Product ID wajib diisi.' });
    }

    // Cek apakah item sudah ada di keranjang
    const checkQuery = `
      SELECT * FROM carts 
      WHERE customer_id = $1 AND product_id = $2 AND (variant_id = $3 OR ($3::int IS NULL AND variant_id IS NULL));
    `;
    const checkResult = await db.query(checkQuery, [customerId, product_id, variant_id || null]);

    if (checkResult.rows.length > 0) {
      // Jika sudah ada, update quantity
      const existingCart = checkResult.rows[0];
      const newQuantity = existingCart.quantity + Number(quantity);

      const updateQuery = `
        UPDATE carts SET quantity = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 RETURNING *;
      `;
      await db.query(updateQuery, [newQuantity, existingCart.id]);
    } else {
      // Jika belum ada, insert baru
      const insertQuery = `
        INSERT INTO carts (customer_id, product_id, variant_id, quantity)
        VALUES ($1, $2, $3, $4) RETURNING *;
      `;
      await db.query(insertQuery, [customerId, product_id, variant_id || null, quantity]);
    }

    return res.status(200).json({ message: 'Berhasil ditambahkan ke keranjang!' });
  } catch (error) {
    console.error('Error Add to Cart:', error);
    return res.status(500).json({ message: 'Gagal menambahkan ke keranjang.' });
  }
};

// 3. UPDATE QUANTITY ITEM IN CART
exports.updateCartQuantity = async (req, res) => {
  const customerId = req.user.id;
  const { cart_id } = req.params;
  const { action } = req.body; // 'increase' atau 'decrease'

  try {
    const cartRes = await db.query('SELECT * FROM carts WHERE id = $1 AND customer_id = $2', [cart_id, customerId]);
    if (cartRes.rows.length === 0) {
      return res.status(404).json({ message: 'Item keranjang tidak ditemukan.' });
    }

    let currentQty = cartRes.rows[0].quantity;

    if (action === 'increase') {
      currentQty += 1;
    } else if (action === 'decrease') {
      currentQty -= 1;
    }

    if (currentQty <= 0) {
      // Hapus jika kuantitas 0
      await db.query('DELETE FROM carts WHERE id = $1', [cart_id]);
      return res.status(200).json({ message: 'Item berhasil dihapus dari keranjang.' });
    }

    await db.query('UPDATE carts SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [currentQty, cart_id]);
    return res.status(200).json({ message: 'Kuantitas berhasil diperbarui.' });

  } catch (error) {
    console.error('Error Update Cart Quantity:', error);
    return res.status(500).json({ message: 'Gagal memperbarui kuantitas.' });
  }
};

// 4. REMOVE ITEM FROM CART
exports.removeFromCart = async (req, res) => {
  const customerId = req.user.id;
  const { cart_id } = req.params;

  try {
    const result = await db.query('DELETE FROM carts WHERE id = $1 AND customer_id = $2 RETURNING *', [cart_id, customerId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Item tidak ditemukan.' });
    }

    return res.status(200).json({ message: 'Item berhasil dihapus dari keranjang.' });
  } catch (error) {
    console.error('Error Delete Cart Item:', error);
    return res.status(500).json({ message: 'Gagal menghapus item dari keranjang.' });
  }
};