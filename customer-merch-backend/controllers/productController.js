const db = require('../db');

// 1. GET PRODUK BERANDA (Produk Terbaru & Best Seller)
// 1. GET PRODUK BERANDA (Dengan Rating, Range Harga, & Hitung Varian Warna)
exports.getHomeProducts = async (req, res) => {
  try {
    // Query Utama Produk Terbaru
    const latestQuery = `
      SELECT 
        p.id, 
        p.name, 
        p.category, 
        p.price, 
        p.image_url, 
        p.product_code, 
        p.created_at,
        MIN(pv.price) as min_price,
        MAX(pv.price) as max_price,
        COUNT(DISTINCT NULLIF(TRIM(pv.color), '')) as color_variant_count,
        COALESCE(AVG(pr.rating), 5.0) as average_rating
      FROM products p
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      LEFT JOIN product_reviews pr ON p.id = pr.product_id
      GROUP BY p.id
      ORDER BY p.id DESC
      LIMIT 10;
    `;

    // Query Utama Best Seller
    const bestSellerQuery = `
      SELECT 
        p.id, 
        p.name, 
        p.category, 
        p.price, 
        p.image_url, 
        p.product_code,
        MIN(pv.price) as min_price,
        MAX(pv.price) as max_price,
        COUNT(DISTINCT NULLIF(TRIM(pv.color), '')) as color_variant_count,
        COALESCE(AVG(pr.rating), 5.0) as average_rating,
        COALESCE(SUM(oi.quantity), 0) as total_sold
      FROM products p
      JOIN product_variants pv ON p.id = pv.product_id
      LEFT JOIN order_items oi ON pv.id = oi.product_variant_id
      LEFT JOIN product_reviews pr ON p.id = pr.product_id
      GROUP BY p.id
      ORDER BY total_sold DESC, p.id DESC
      LIMIT 10;
    `;

    const latestRes = await db.query(latestQuery);
    const bestSellerRes = await db.query(bestSellerQuery);

    return res.status(200).json({
      latest_products: latestRes.rows,
      best_sellers: bestSellerRes.rows
    });
  } catch (error) {
    console.error('Error Fetching Home Products:', error);
    return res.status(500).json({ message: 'Gagal memuat produk beranda.' });
  }
};
// 2. GET DAFTAR PRODUK KATALOG (Dengan Filter Kategori & Pencarian)


// GET KATALOG PRODUK LENGKAP DENGAN FILTER & COUNT
exports.getAllProducts = async (req, res) => {
  try {
    const { 
      category,     // string atau array (misal: 'Tote Bag,Topi')
      price_range,  // 'under_50k', '50k_100k', 'above_100k'
      segment,      // 'Anak - Anak', 'Dewasa'
      search,       // kata kunci pencarian
      sort          // 'latest', 'price_asc', 'price_desc'
    } = req.query;

    // 1. QUERY UTAMA AMBIL PRODUK
    let query = `
      SELECT 
        p.id, 
        p.name, 
        p.category, 
        p.price, 
        p.image_url, 
        p.product_code,
        p.created_at,
        COUNT(pv.id) as variant_count,
        COALESCE(SUM(pv.stock), p.stock, 0) as total_stock
      FROM products p
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      WHERE 1=1
    `;

    const queryParams = [];

    // Filter Kategori (Bisa Multiple dipisah koma)
    if (category) {
      const categories = category.split(',').map(c => c.trim().toLowerCase());
      queryParams.push(categories);
      query += ` AND LOWER(p.category) = ANY($${queryParams.length})`;
    }

    // Filter Rentang Harga
    if (price_range) {
      if (price_range === 'under_50k') {
        query += ` AND p.price < 50000`;
      } else if (price_range === '50k_100k') {
        query += ` AND p.price >= 50000 AND p.price <= 100000`;
      } else if (price_range === 'above_100k') {
        query += ` AND p.price > 100000`;
      }
    }

    // Filter Target Segmen (Tab: Anak-Anak / Dewasa / Semua)
    if (segment && segment.toLowerCase() !== 'semua') {
      queryParams.push(`%${segment.toLowerCase()}%`);
      query += ` AND (LOWER(p.name) LIKE $${queryParams.length} OR LOWER(p.category) LIKE $${queryParams.length})`;
    }

    // Filter Kata Kunci Search
    if (search) {
      queryParams.push(`%${search.toLowerCase()}%`);
      query += ` AND (LOWER(p.name) LIKE $${queryParams.length} OR LOWER(p.product_code) LIKE $${queryParams.length})`;
    }

    query += ` GROUP BY p.id`;

    // Sorting Order
    if (sort === 'price_asc') {
      query += ` ORDER BY p.price ASC`;
    } else if (sort === 'price_desc') {
      query += ` ORDER BY p.price DESC`;
    } else {
      query += ` ORDER BY p.created_at DESC`;
    }

    const productsResult = await db.query(query, queryParams);

    // 2. QUERY METADATA CATEGORY COUNTS FOR SIDEBAR
    const categoryCountQuery = `
      SELECT category, COUNT(*) as total 
      FROM products 
      GROUP BY category 
      ORDER BY category ASC;
    `;
    const categoryCountResult = await db.query(categoryCountQuery);

    return res.status(200).json({
      total_found: productsResult.rows.length,
      products: productsResult.rows,
      category_counts: categoryCountResult.rows
    });

  } catch (error) {
    console.error('Error Fetching Catalog Products:', error);
    return res.status(500).json({ message: 'Gagal memuat katalog produk.' });
  }
};

// 3. GET DETAIL PRODUK BY ID (Termasuk Variannya)
exports.getProductById = async (req, res) => {
  const { id } = req.params;

  try {
    const productQuery = `SELECT * FROM products WHERE id = $1;`;
    const variantsQuery = `SELECT * FROM product_variants WHERE product_id = $1;`;

    const productRes = await db.query(productQuery, [id]);
    if (productRes.rows.length === 0) {
      return res.status(404).json({ message: 'Produk tidak ditemukan.' });
    }

    const variantsRes = await db.query(variantsQuery, [id]);

    return res.status(200).json({
      product: productRes.rows[0],
      variants: variantsRes.rows
    });
  } catch (error) {
    console.error('Error Fetching Product Detail:', error);
    return res.status(500).json({ message: 'Gagal memuat detail produk.' });
  }
};

// 4. GET STORES FOR LOCATOR
exports.getStores = async (req, res) => {
  try {
    const query = `
      SELECT id, name, location, region, operating_hours, phone, is_active
      FROM stores
      WHERE is_active = true
      ORDER BY region ASC, name ASC;
    `;
    const result = await db.query(query);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error Fetching Stores:', error);
    return res.status(500).json({ message: 'Gagal memuat lokasi toko.' });
  }
};


// 1. GET DETAIL PRODUK LENGKAP (Termasuk Varian & Produk Terkait)
exports.getProductDetail = async (req, res) => {
  const { id } = req.params;

  try {
    // A. Query Data Utama Produk
    const productQuery = `
      SELECT id, name, category, price, product_code, description, 
             size_material_info, image_url, created_at
      FROM products 
      WHERE id = $1;
    `;
    const productRes = await db.query(productQuery, [id]);

    if (productRes.rows.length === 0) {
      return res.status(404).json({ message: 'Produk tidak ditemukan.' });
    }

    const product = productRes.rows[0];

    // B. Query Daftar Varian (Warna, Ukuran, Stok, Gambar Spesifik Varian)
    const variantsQuery = `
      SELECT id, color_name, color_hex, size, stock, image_url
      FROM product_variants 
      WHERE product_id = $1
      ORDER BY color_name ASC, size ASC;
    `;
    const variantsRes = await db.query(variantsQuery, [id]);

    // C. Query Summary Rating & 2 Ulasan Terbaru untuk Preview Page
    const reviewsSummaryQuery = `
      SELECT 
        COALESCE(AVG(rating), 5.0) as average_rating,
        COUNT(id) as total_reviews
      FROM product_reviews 
      WHERE product_id = $1;
    `;
    const reviewsSummaryRes = await db.query(reviewsSummaryQuery, [id]);

    const latestReviewsQuery = `
      SELECT r.id, r.user_name, r.rating, r.comment, r.variant_info, r.created_at
      FROM product_reviews r
      WHERE r.product_id = $1
      ORDER BY r.created_at DESC
      LIMIT 2;
    `;
    const latestReviewsRes = await db.query(latestReviewsQuery, [id]);

    // D. Query Produk Terkait (Kategori / Segmen Sama, Kecuali Produk Ini)
    const relatedProductsQuery = `
      SELECT p.id, p.name, p.category, p.price, p.image_url,
             COUNT(pv.id) as variant_count
      FROM products p
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      WHERE p.category = $1 AND p.id != $2
      GROUP BY p.id
      LIMIT 4;
    `;
    const relatedRes = await db.query(relatedProductsQuery, [product.category, id]);

    return res.status(200).json({
      product,
      variants: variantsRes.rows,
      rating_summary: {
        average: parseFloat(reviewsSummaryRes.rows[0].average_rating).toFixed(1),
        total: parseInt(reviewsSummaryRes.rows[0].total_reviews)
      },
      preview_reviews: latestReviewsRes.rows,
      related_products: relatedRes.rows
    });

  } catch (error) {
    console.error('Error Fetching Product Detail:', error);
    return res.status(500).json({ message: 'Gagal memuat detail produk.' });
  }
};

// 2. GET SEMUA ULASAN PRODUK (Untuk Popup / Modal "Lihat Semua Review")
exports.getProductReviews = async (req, res) => {
  const { id } = req.params;

  try {
    const reviewsQuery = `
      SELECT id, user_name, rating, comment, variant_info, created_at
      FROM product_reviews
      WHERE product_id = $1
      ORDER BY created_at DESC;
    `;
    const result = await db.query(reviewsQuery, [id]);

    return res.status(200).json({
      total_reviews: result.rows.length,
      reviews: result.rows
    });
  } catch (error) {
    console.error('Error Fetching Product Reviews:', error);
    return res.status(500).json({ message: 'Gagal memuat ulasan produk.' });
  }
};