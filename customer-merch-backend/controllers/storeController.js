const db = require('../db');

// GET DAFTAR OUTLET STORE UNTUK CUSTOMER (TERINTEGRASI SINKRON DENGAN ADMIN PANEL)
exports.getStores = async (req, res) => {
  const { region, search } = req.query;

  try {
    // 1. QUERY UNTUK MENAMPILKAN OUTLET YANG HANYA BERSTATUS 'Aktif' (is_active = true) DARI ADMIN PANEL
    let query = `
      SELECT 
        id, 
        name, 
        region, 
        location_detail, 
        address, 
        operating_hours, 
        phone, 
        latitude, 
        longitude, 
        google_maps_url,
        is_active
      FROM stores
      WHERE is_active = true
    `;

    const queryParams = [];

    // Filter berdasarkan Tab Wilayah (JABODETABEK, Bandung, Surabaya, Yogyakarta)
    if (region && region.toLowerCase() !== 'semua') {
      queryParams.push(region);
      query += ` AND LOWER(region) = LOWER($${queryParams.length})`;
    }

    // Filter berdasarkan Pencarian Kata Kunci (Nama Outlet / Lokasi / Alamat)
    if (search && search.trim() !== '') {
      queryParams.push(`%${search.trim().toLowerCase()}%`);
      query += ` AND (LOWER(name) LIKE $${queryParams.length} OR LOWER(location_detail) LIKE $${queryParams.length} OR LOWER(address) LIKE $${queryParams.length})`;
    }

    query += ` ORDER BY id ASC;`;

    const storesResult = await db.query(query, queryParams);

    // 2. HITUNG RINGKASAN WILAYAH DINAMIS HANYA DARI OUTLET YANG AKTIF
    const regionSummaryQuery = `
      SELECT region, COUNT(*) as count 
      FROM stores 
      WHERE is_active = true 
      GROUP BY region 
      ORDER BY region ASC;
    `;
    const regionSummaryResult = await db.query(regionSummaryQuery);

    // Hitung total outlet aktif & total kota/wilayah
    const totalActiveOutlets = storesResult.rows.length;
    const totalActiveRegions = regionSummaryResult.rows.length;

    return res.status(200).json({
      summary_text: `${totalActiveOutlets} LOKASI STORE TERSEBAR DI ${totalActiveRegions} KOTA`,
      total_outlets: totalActiveOutlets,
      total_regions: totalActiveRegions,
      region_counts: regionSummaryResult.rows, // Mengembalikan array count [{ region: 'JABODETABEK', count: 8 }, ...]
      stores: storesResult.rows.map(store => ({
        ...store,
        // Fallback Google Maps URL jika belum diisi manual oleh Admin
        google_maps_url: store.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.name + ' ' + (store.location_detail || ''))}`
      }))
    });

  } catch (error) {
    console.error('Error Syncing Store Outlets from Admin Panel:', error);
    return res.status(500).json({ message: 'Gagal memuat data outlet store.' });
  }
};