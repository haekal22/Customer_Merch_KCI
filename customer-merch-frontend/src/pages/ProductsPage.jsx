import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, 
  User, 
  Heart, 
  ShoppingBag, 
  ChevronDown, 
  Star, 
  Loader2 
} from 'lucide-react';

const ProductsPage = () => {
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalFound, setTotalFound] = useState(0);

  // State Filter & Sorting
  const [selectedSegment, setSelectedSegment] = useState('Semua');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState('');
  const [selectedSort, setSelectedSort] = useState('latest');
  const [searchQuery, setSearchQuery] = useState('');

  // Wishlist Local State
  const [wishlist, setWishlist] = useState([]);

  // Helper Format Harga Rupiah & Rentang Harga
  const formatPriceRange = (price, minPrice, maxPrice) => {
    const min = Number(minPrice || price || 0);
    const max = Number(maxPrice || price || 0);

    const formatNum = (num) => new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num).replace('IDR', 'Rp');

    if (min > 0 && max > 0 && min !== max) {
      return `${formatNum(min)} - ${formatNum(max)}`;
    }
    return formatNum(min || price);
  };

  // Toggle Wishlist
  const toggleWishlist = (productId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (wishlist.includes(productId)) {
      setWishlist(wishlist.filter(id => id !== productId));
    } else {
      setWishlist([...wishlist, productId]);
    }
  };

  // Handle Selection Checkbox Kategori
  const handleCategoryChange = (categoryName) => {
    if (selectedCategories.includes(categoryName)) {
      setSelectedCategories(selectedCategories.filter(c => c !== categoryName));
    } else {
      setSelectedCategories([...selectedCategories, categoryName]);
    }
  };

  // Fetch Data Katalog Produk dari Backend
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setLoading(true);
        
        const params = new URLSearchParams();
        if (selectedCategories.length > 0) {
          params.append('category', selectedCategories.join(','));
        }
        if (selectedPriceRange) {
          params.append('price_range', selectedPriceRange);
        }
        if (selectedSegment) {
          params.append('segment', selectedSegment);
        }
        if (searchQuery) {
          params.append('search', searchQuery);
        }
        if (selectedSort) {
          params.append('sort', selectedSort);
        }

        const response = await axios.get(`http://localhost:5001/api/customer/products?${params.toString()}`);
        
        const fetchedProducts = response.data.products || response.data || [];
        setProducts(fetchedProducts);
        setTotalFound(response.data.total_found || fetchedProducts.length);
        
        if (response.data.category_counts) {
          setCategoryCounts(response.data.category_counts);
        }

      } catch (error) {
        console.error("Gagal mengambil katalog produk:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, [selectedCategories, selectedPriceRange, selectedSegment, selectedSort, searchQuery]);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800 flex flex-col w-full">
      {/* 1. MAIN HEADER NAVIGATION */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 w-full shadow-sm">
        <div className="w-full px-8 md:px-12 py-5 md:py-6 flex items-center justify-between gap-10">
          <a href="/" className="shrink-0">
            <img src="/assets/images/logo-cmerch.svg" alt="C-Merch" className="h-10 md:h-12 w-auto object-contain" />
          </a>

          <nav className="flex items-center gap-8 font-bold text-sm md:text-base uppercase tracking-wide text-gray-800">
            <a href="/" className="hover:text-red-600">Beranda</a>
            
            <div 
              className="relative py-1 cursor-pointer group"
              onMouseEnter={() => setIsCategoryOpen(true)}
              onMouseLeave={() => setIsCategoryOpen(false)}
            >
              <button className="flex items-center gap-1.5 text-gray-800 hover:text-red-600 font-bold">
                Anak - Anak <ChevronDown size={16} />
              </button>

              {isCategoryOpen && (
                <div className="absolute top-full left-0 w-[500px] bg-white border border-gray-200 shadow-xl rounded-2xl p-6 grid grid-cols-2 gap-6 text-left normal-case z-50">
                  <div>
                    <h4 className="font-bold text-base text-gray-900 mb-3 border-b pb-1">Kategori Anak-Anak</h4>
                    <ul className="space-y-2.5 text-sm font-normal text-gray-600">
                      <li><a href="#anak-kaos" className="hover:text-red-600">Pakaian & Kaos</a></li>
                      <li><a href="#anak-topi" className="hover:text-red-600">Topi & Aksesoris</a></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-gray-900 mb-3 border-b pb-1">Kategori Dewasa</h4>
                    <ul className="space-y-2.5 text-sm font-normal text-gray-600">
                      <li><a href="#dewasa-kaos" className="hover:text-red-600">T-Shirt & Outerwear</a></li>
                      <li><a href="#dewasa-tas" className="hover:text-red-600">Tas & Pouch</a></li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <a href="#dewasa" className="hover:text-red-600">Dewasa</a>
            <a href="/products" className="text-red-600 border-b-2 border-red-600 pb-1">Semua Produk</a>
          </nav>

          {/* Search Bar */}
          <div className="flex-grow max-w-lg relative">
            <input 
              type="text" 
              placeholder="Apa yang anda cari?" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-100 rounded-full py-3.5 pl-6 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-red-600"
            />
            <Search className="absolute right-4 top-4 text-gray-400" size={18} />
          </div>

          <div className="flex items-center gap-6 text-gray-800">
            <a href="/auth" className="hover:text-red-600"><User size={26} /></a>
            <a href="#wishlist" className="hover:text-red-600 relative">
              <Heart size={26} />
              {wishlist.length > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-red-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {wishlist.length}
                </span>
              )}
            </a>
            <a href="#cart" className="hover:text-red-600 relative">
              <ShoppingBag size={26} />
              <span className="absolute -top-1.5 -right-2 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">0</span>
            </a>
          </div>
        </div>
      </header>

      {/* 2. BREADCRUMB NAVIGATION */}
      <div className="pt-[105px] md:pt-[115px] px-8 md:px-12 py-4 bg-white text-sm font-semibold text-gray-500 flex items-center gap-2">
        <a href="/" className="hover:text-red-600">Beranda</a>
        <span className="text-gray-400">/</span>
        <span className="text-red-600 font-bold">Semua Produk</span>
      </div>

      {/* 3. MAIN CONTENT AREA */}
      <div className="w-full px-8 md:px-12 py-6 flex gap-10">
        
        {/* SIDEBAR FILTER (KIRI) */}
        <aside className="w-72 md:w-80 shrink-0 flex flex-col gap-8 text-sm text-gray-800 pr-8">
          
          {/* Header Filter */}
          <div className="flex justify-between items-center pb-2">
            <h3 className="font-extrabold text-base uppercase tracking-wider text-gray-900">FILTER</h3>
            {(selectedCategories.length > 0 || selectedPriceRange) && (
              <button 
                onClick={() => { setSelectedCategories([]); setSelectedPriceRange(''); }} 
                className="text-red-600 hover:underline text-xs font-bold"
              >
                Reset
              </button>
            )}
          </div>

          {/* Filter Kategori */}
          <div>
            <h4 className="font-bold text-xs uppercase text-gray-900 mb-4 tracking-wider">KATEGORI</h4>
            <div className="space-y-3.5 text-gray-700 font-medium text-sm">
              {['Tote Bag', 'Gantungan Kunci', 'Topi', 'Tumbler', 'Mewarnai', 'Pakaian & Kaos'].map((cat) => {
                const countObj = categoryCounts.find(c => c.category?.toLowerCase() === cat.toLowerCase());
                const count = countObj ? countObj.total : 0;

                return (
                  <label key={cat} className="flex items-center justify-between cursor-pointer hover:text-red-600 transition">
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        checked={selectedCategories.includes(cat)}
                        onChange={() => handleCategoryChange(cat)}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer"
                      />
                      <span className="text-sm font-semibold">{cat}</span>
                    </div>
                    <span className="text-gray-400 text-xs">({count})</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Filter Rentang Harga */}
          <div>
            <h4 className="font-bold text-xs uppercase text-gray-900 mb-4 tracking-wider">RENTANG HARGA</h4>
            <div className="space-y-3.5 text-gray-700 font-medium text-sm">
              {[
                { label: 'Under Rp 50.000', value: 'under_50k' },
                { label: 'Rp 50.000 - Rp 100.000', value: '50k_100k' },
                { label: 'Above Rp 100.000', value: 'above_100k' },
              ].map((range) => (
                <label key={range.value} className="flex items-center gap-3 cursor-pointer hover:text-red-600 transition">
                  <input 
                    type="radio" 
                    name="price_range"
                    checked={selectedPriceRange === range.value}
                    onChange={() => setSelectedPriceRange(selectedPriceRange === range.value ? '' : range.value)}
                    className="text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-sm font-semibold">{range.label}</span>
                </label>
              ))}
            </div>
          </div>

        </aside>

        {/* CATALOG AREA (KANAN) */}
        <main className="flex-1">
          
          {/* TOP BAR FILTER DENGAN GARIS MERAH SESUAI ACUAN */}
          <div className="flex justify-between items-center pb-3 border-b-2 border-[#E5231B] mb-6">
            
            {/* Total Produk Ditemukan */}
            <p className="text-sm text-gray-600 font-medium">
              <strong className="text-gray-900 font-bold">{totalFound}</strong> produk ditemukan
            </p>

            {/* Filter Segmen Pill Button & Sort Dropdown */}
            <div className="flex items-center gap-6">
              
              {/* Tab Segmen Pill shape */}
              <div className="flex bg-gray-100 p-1 rounded-full text-xs font-bold text-gray-600">
                {['Semua', 'Anak - Anak', 'Dewasa'].map((seg) => (
                  <button
                    key={seg}
                    onClick={() => setSelectedSegment(seg)}
                    className={`px-6 py-1.5 rounded-full transition cursor-pointer ${
                      selectedSegment === seg 
                        ? 'bg-[#E5231B] text-white shadow-sm' 
                        : 'hover:text-gray-900'
                    }`}
                  >
                    {seg}
                  </button>
                ))}
              </div>

              {/* Sorting Dropdown */}
              <div className="relative flex items-center gap-2 text-xs font-semibold text-gray-700">
                <span>Urutkan:</span>
                <select 
                  value={selectedSort}
                  onChange={(e) => setSelectedSort(e.target.value)}
                  className="bg-gray-100 border-none rounded-lg px-3 py-1.5 text-xs font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-red-600 cursor-pointer"
                >
                  <option value="latest">Terbaru</option>
                  <option value="price_asc">Harga Terendah</option>
                  <option value="price_desc">Harga Tertinggi</option>
                </select>
              </div>

            </div>
          </div>

          {/* GRID KATALOG PRODUK (3 CARD PER BARIS DENGAN HOVER DETAIL BUTTON) */}
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
              <Loader2 className="animate-spin" size={24} />
              <span className="text-xs font-semibold">Memuat Produk Katalog...</span>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-sm font-semibold mb-1">Produk Tidak Ditemukan</p>
              <p className="text-xs">Coba sesuaikan filter kategori atau kata kunci pencarian kamu.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {products.map((p) => {
                const variantCount = Number(p.color_variant_count || p.variant_count || 1);

                return (
                  <div 
                    key={p.id} 
                    className="group relative flex flex-col justify-between cursor-pointer border-r border-gray-100 last:border-r-0 pr-2"
                    onClick={() => window.location.href = `/products/${p.id}`}
                  >
                    
                    {/* Container Gambar Produk */}
                    <div className="relative aspect-square bg-[#F3F4F6] rounded-md p-4 flex items-center justify-center overflow-hidden">
                      
                      {/* Rating Badge ⭐ 5.0 */}
                      <div className="absolute top-3 left-3 bg-gray-200/80 backdrop-blur-sm px-2 py-0.5 rounded flex items-center gap-1 text-[11px] font-bold text-gray-700 z-10">
                        <Star size={11} className="fill-amber-400 text-amber-400" />
                        <span>{Number(p.average_rating || 5.0).toFixed(1)}</span>
                      </div>

                      {/* Tombol Wishlist Love */}
                      <button 
                        onClick={(e) => toggleWishlist(p.id, e)}
                        className="absolute top-3 right-3 w-7 h-7 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-sm z-10 transition transform active:scale-95 cursor-pointer"
                      >
                        <Heart 
                          size={14} 
                          className={wishlist.includes(p.id) ? "fill-red-600 text-red-600" : "text-gray-800 hover:text-red-600"} 
                        />
                      </button>

                      {/* Gambar Produk */}
                      <img 
                        src={p.image_url || '/assets/images/product-placeholder.jpg'} 
                        alt={p.name} 
                        className="w-full h-full object-contain transition duration-300 group-hover:scale-105" 
                      />

                      {/* HOVER overlay: Tombol Merah "Lihat Detail Produk" di bagian bawah gambar */}
                      <div className="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
                        <button className="w-full bg-[#E5231B] text-white py-2.5 text-xs font-bold uppercase tracking-wider text-center block shadow-md">
                          Lihat Detail Produk
                        </button>
                      </div>

                    </div>

                    {/* Deskripsi Teks Produk */}
                    <div className="pt-3 pb-2 flex flex-col justify-between flex-grow">
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 line-clamp-1 mb-1">{p.name}</h4>
                        <p className="text-sm font-extrabold text-[#E5231B] mb-1">
                          {formatPriceRange(p.price, p.min_price, p.max_price)}
                        </p>
                      </div>
                      <p className="text-[11px] font-medium text-gray-400">
                        {variantCount} {variantCount > 1 ? 'varians' : 'varian'}
                      </p>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </main>
      </div>

      {/* 4. FOOTER */}
      <footer className="mt-auto bg-white border-t border-gray-200 pt-10 pb-6 px-8 md:px-12 text-xs text-gray-600 w-full">
        <div className="w-full grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
          <div>
            <img src="/assets/images/logo-cmerch.svg" alt="C-Merch" className="h-8 w-auto mb-4 object-contain" />
            <p className="text-[11px] leading-relaxed text-gray-500">
              Official Store Merchandise Resmi PT Kereta Api Indonesia (Persero).
            </p>
          </div>
          <div>
            <h5 className="font-bold text-gray-900 mb-3">BELANJA</h5>
            <ul className="space-y-2 text-gray-500">
              <li><a href="#kategori" className="hover:underline">Kategori</a></li>
              <li><a href="#terbaru" className="hover:underline">Produk Terbaru</a></li>
              <li><a href="#bestseller" className="hover:underline">Best Seller</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-gray-900 mb-3">BANTUAN</h5>
            <ul className="space-y-2 text-gray-500">
              <li><a href="#faq" className="hover:underline">FAQ</a></li>
              <li><a href="#pengiriman" className="hover:underline">Pengiriman</a></li>
              <li><a href="#pengembalian" className="hover:underline">Pengembalian</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-gray-900 mb-3">PEMBAYARAN</h5>
            <p className="text-[11px] text-gray-500 mb-2">Mendukung E-Wallet & Bank Transfer Mandiri, BCA, BRI, QRIS.</p>
          </div>
          <div>
            <h5 className="font-bold text-gray-900 mb-3">IKUTI KAMI</h5>
            <div className="flex gap-3 text-gray-700 font-bold">
              <a href="#instagram" className="hover:text-red-600">Instagram</a>
              <a href="#tiktok" className="hover:text-red-600">TikTok</a>
            </div>
          </div>
        </div>
        <div className="w-full border-t border-gray-200 pt-6 flex justify-between items-center text-[11px] text-gray-400">
          <p>© 2026 C-Merch Official Store. Seluruh hak cipta dilindungi.</p>
        </div>
      </footer>
    </div>
  );
};

export default ProductsPage;