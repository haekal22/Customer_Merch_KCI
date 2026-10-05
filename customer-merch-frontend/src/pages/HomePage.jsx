import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, 
  User, 
  Heart, 
  ShoppingBag, 
  MapPin, 
  ChevronRight, 
  ChevronDown,
  ArrowRight,
  Loader2,
  Star
} from 'lucide-react';

const HomePage = () => {
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [newProducts, setNewProducts] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState([]); // Array ID produk yang di-wishlist

  // Helper Format Harga Rupiah & Rentang Harga (Range)
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

  // Toggle Item Wishlist (Fitur Tombol Love)
  const toggleWishlist = (productId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (wishlist.includes(productId)) {
      setWishlist(wishlist.filter(id => id !== productId));
    } else {
      setWishlist([...wishlist, productId]);
    }
  };

  // Fetch Produk Beranda dari Backend Customer
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5001/api/customer/products/home');
        
        console.log("Data Beranda dari Backend Customer:", response.data);

        const latest = response.data.latest_products || [];
        const best = response.data.best_sellers || [];

        // Helper Normalisasi Data
        const normalize = (items) => items.map(p => {
          // Jika tidak ada varian warna terpisah, default minimal 1 varian
          const rawVariantCount = Number(p.color_variant_count || p.variant_count || 1);
          const variantCount = rawVariantCount === 0 ? 1 : rawVariantCount;

          return {
            id: p.id,
            name: p.name,
            price: Number(p.price || 0),
            min_price: p.min_price,
            max_price: p.max_price,
            rating: Number(p.average_rating || 5.0).toFixed(1),
            variantCount: variantCount,
            image_url: p.image_url || '/assets/images/product-placeholder.jpg',
            total_sold: Number(p.total_sold || 0)
          };
        });

        setNewProducts(normalize(latest).slice(0, 5));
        setBestSellers(normalize(best).slice(0, 5));

      } catch (error) {
        console.error("Gagal mengambil data beranda dari Backend Customer:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800 flex flex-col w-full">
      {/* 1. MAIN HEADER NAVIGATION */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 w-full shadow-sm">
        <div className="w-full px-8 md:px-12 py-5 md:py-6 flex items-center justify-between gap-10">
          {/* Logo */}
          <a href="/" className="shrink-0">
            <img src="/assets/images/logo-cmerch.svg" alt="C-Merch" className="h-10 md:h-12 w-auto object-contain" />
          </a>

          {/* Navigation Links */}
          <nav className="flex items-center gap-8 font-bold text-sm md:text-base uppercase tracking-wide text-gray-800">
            <a href="/" className="text-red-600 border-b-2 border-red-600 pb-1">Beranda</a>
            
            <div 
              className="relative py-1 cursor-pointer group"
              onMouseEnter={() => setIsCategoryOpen(true)}
              onMouseLeave={() => setIsCategoryOpen(false)}
            >
              <button className="flex items-center gap-1.5 text-gray-800 hover:text-red-600 font-bold">
                Anak - Anak <ChevronDown size={16} />
              </button>

              {/* Mega Menu Dropdown */}
              {isCategoryOpen && (
                <div className="absolute top-full left-0 w-[500px] bg-white border border-gray-200 shadow-xl rounded-2xl p-6 grid grid-cols-2 gap-6 text-left normal-case z-50">
                  <div>
                    <h4 className="font-bold text-base text-gray-900 mb-3 border-b pb-1">Kategori Anak-Anak</h4>
                    <ul className="space-y-2.5 text-sm font-normal text-gray-600">
                      <li><a href="#anak-kaos" className="hover:text-red-600">Pakaian & Kaos</a></li>
                      <li><a href="#anak-topi" className="hover:text-red-600">Topi & Aksesoris</a></li>
                      <li><a href="#anak-mainan" className="hover:text-red-600">Mainan & Miniatur</a></li>
                      <li><a href="#anak-sekolah" className="hover:text-red-600">Perlengkapan Sekolah</a></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-gray-900 mb-3 border-b pb-1">Kategori Dewasa</h4>
                    <ul className="space-y-2.5 text-sm font-normal text-gray-600">
                      <li><a href="#dewasa-kaos" className="hover:text-red-600">T-Shirt & Outerwear</a></li>
                      <li><a href="#dewasa-tas" className="hover:text-red-600">Tas & Pouch</a></li>
                      <li><a href="#dewasa-tumbler" className="hover:text-red-600">Botol & Tumbler</a></li>
                      <li><a href="#dewasa-e-money" className="hover:text-red-600">Kartu E-Money</a></li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <a href="#dewasa" className="hover:text-red-600">Dewasa</a>
            <a href="#semua-produk" className="hover:text-red-600">Semua Produk</a>
          </nav>

          {/* Search Bar */}
          <div className="flex-grow max-w-lg relative">
            <input 
              type="text" 
              placeholder="Apa yang anda cari?" 
              className="w-full bg-gray-100 rounded-full py-3.5 pl-6 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-red-600"
            />
            <Search className="absolute right-4 top-4 text-gray-400" size={18} />
          </div>

          {/* Action Icons */}
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

      {/* 2. HERO BANNER UTAMA */}
      <section className="relative w-full bg-gray-100 pt-[95px] md:pt-[105px]">
        <div className="w-full relative flex items-center justify-center">
          <img 
            src="/assets/images/home.svg" 
            alt="Buah Tangan Perjalanan" 
            className="w-full h-auto block"
          />
          
          {/* Overlay Content Centered */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pt-36 md:pt-52 lg:pt-64 z-10 text-center px-4">
            <h2 className="text-2xl md:text-4xl lg:text-[40px] font-extrabold tracking-tight mb-4 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
              #BuahTanganPerjalanan
            </h2>

            <div className="flex flex-row items-center justify-center gap-4 md:gap-6">
              <button className="bg-[#E5231B] hover:bg-red-700 text-white text-sm md:text-base lg:text-lg font-extrabold py-3.5 px-8 md:py-4 md:px-10 rounded-full shadow-lg transition cursor-pointer tracking-wide">
                Belanja Sekarang
              </button>
              <button className="bg-[#E5231B] hover:bg-red-700 text-white text-xs md:text-base lg:text-lg font-extrabold py-3.5 px-8 md:py-4 md:px-10 rounded-full shadow-lg transition cursor-pointer tracking-wide">
                Cari Store Terdekat
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PRODUK TERBARU */}
      <section className="w-full px-4 md:px-8 py-10">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-extrabold text-gray-900 tracking-tight uppercase">PRODUK TERBARU</h3>
          <a href="#semua-terbaru" className="text-xs font-semibold text-gray-500 hover:text-red-600 flex items-center gap-1">
            Lihat Semua <ChevronRight size={14} />
          </a>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
            <Loader2 className="animate-spin" size={20} />
            <span className="text-xs font-semibold">Memuat Produk Terbaru...</span>
          </div>
        ) : newProducts.length === 0 ? (
          <p className="text-center text-xs text-gray-500 py-8">Belum ada produk terbaru.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
            {newProducts.map((p) => (
              <div key={p.id} className="group relative rounded-xl overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                
                {/* Image Container dengan Badge Rating & Heart Wishlist */}
                <div className="relative aspect-square bg-[#F3F4F6] p-4 flex items-center justify-center overflow-hidden">
                  
                  {/* Badge Rating ⭐ 5.0 */}
                  <div className="absolute top-2.5 left-2.5 bg-gray-200/80 backdrop-blur-sm px-2 py-0.5 rounded-md flex items-center gap-1 text-[11px] font-bold text-gray-700 z-10 shadow-sm">
                    <Star size={11} className="fill-amber-400 text-amber-400" />
                    <span>{p.rating}</span>
                  </div>

                  {/* Tombol Wishlist / Heart */}
                  <button 
                    onClick={(e) => toggleWishlist(p.id, e)}
                    className="absolute top-2.5 right-2.5 w-7 h-7 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-sm z-10 transition transform active:scale-95 cursor-pointer"
                  >
                    <Heart 
                      size={14} 
                      className={wishlist.includes(p.id) ? "fill-red-600 text-red-600" : "text-gray-600 hover:text-red-600"} 
                    />
                  </button>

                  <img 
                    src={p.image_url} 
                    alt={p.name} 
                    className="w-full h-full object-contain group-hover:scale-105 transition duration-300" 
                  />
                </div>

                {/* Info Detail Produk */}
                <div className="p-3.5 flex flex-col justify-between flex-grow">
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 line-clamp-1 mb-1">{p.name}</h4>
                    <p className="text-xs font-bold text-[#E5231B] mb-2">
                      {formatPriceRange(p.price, p.min_price, p.max_price)}
                    </p>
                  </div>
                  <p className="text-[11px] font-medium text-gray-400">
                    {p.variantCount} {p.variantCount > 1 ? 'varians' : 'varian'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. BEST SELLER (TAMPILAN NAVY SLATE SESUAI ACUAN FOTO 2) */}
      <section className="w-full px-4 md:px-8 pb-10">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-extrabold text-gray-900 tracking-tight uppercase">BEST SELLER</h3>
          <a href="#semua-bestseller" className="text-xs font-semibold text-gray-500 hover:text-red-600 flex items-center gap-1">
            Lihat Semua <ChevronRight size={14} />
          </a>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
            <Loader2 className="animate-spin" size={20} />
            <span className="text-xs font-semibold">Memuat Produk Best Seller...</span>
          </div>
        ) : bestSellers.length === 0 ? (
          <p className="text-center text-xs text-gray-500 py-8">Belum ada produk Best Seller.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
            {bestSellers.map((p) => (
              <div key={p.id} className="group relative rounded-xl overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                
                {/* Image Container dengan Badge Rating & Heart Wishlist */}
                <div className="relative aspect-square bg-[#F8F9FA] p-4 flex items-center justify-center overflow-hidden">
                  
                  {/* Badge Rating ⭐ 5.0 */}
                  <div className="absolute top-2.5 left-2.5 bg-gray-200/80 backdrop-blur-sm px-2 py-0.5 rounded-md flex items-center gap-1 text-[11px] font-bold text-gray-700 z-10 shadow-sm">
                    <Star size={11} className="fill-amber-400 text-amber-400" />
                    <span>{p.rating}</span>
                  </div>

                  {/* Tombol Wishlist / Heart */}
                  <button 
                    onClick={(e) => toggleWishlist(p.id, e)}
                    className="absolute top-2.5 right-2.5 w-7 h-7 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-sm z-10 transition transform active:scale-95 cursor-pointer"
                  >
                    <Heart 
                      size={14} 
                      className={wishlist.includes(p.id) ? "fill-red-600 text-red-600" : "text-gray-600 hover:text-red-600"} 
                    />
                  </button>

                  <img 
                    src={p.image_url} 
                    alt={p.name} 
                    className="w-full h-full object-contain group-hover:scale-105 transition duration-300" 
                  />
                </div>

                {/* Info Detail Produk versi Dark Navy Slate */}
                <div className="p-3.5 bg-[#1E293B] text-white flex flex-col justify-between flex-grow">
                  <div>
                    <h4 className="text-xs font-bold line-clamp-1 mb-1 text-white">{p.name}</h4>
                    <p className="text-xs font-bold text-gray-100 mb-2">
                      {formatPriceRange(p.price, p.min_price, p.max_price)}
                    </p>
                  </div>
                  <p className="text-[11px] font-normal text-gray-300">
                    {p.variantCount} {p.variantCount > 1 ? 'varians' : 'varian'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. BANNER KATEGORI ANAK-ANAK */}
      <section className="w-full pb-10">
        <div className="w-full">
          <img 
            src="/assets/images/anakanak.svg" 
            alt="Kategori Anak-Anak" 
            className="w-full h-auto block"
          />
        </div>
      </section>

      {/* 6. BANNER KATEGORI DEWASA */}
      <section className="w-full pb-10">
        <div className="w-full">
          <img 
            src="/assets/images/dewasa.svg" 
            alt="Kategori Dewasa" 
            className="w-full h-auto block"
          />
        </div>
      </section>

      {/* 7. LOKASI TOKO / KUNJUNGI KAMI */}
      <section className="w-full pb-10">
        <div className="relative w-full overflow-hidden flex items-center justify-start">
          <img 
            src="/assets/images/kunjungi.svg" 
            alt="Peta Lokasi Stasiun Kunjungi Kami" 
            className="w-full h-auto block object-cover"
          />

          <img 
            src="/assets/images/blur.svg" 
            alt="" 
            className="absolute inset-0 w-full h-full object-cover pointer-events-none z-5 blur-lg backdrop-blur-md opacity-90"
          />

          <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-12 text-white z-10 bg-black/10">
            <h3 className="text-xl md:text-3xl font-extrabold tracking-wide mb-2 uppercase drop-shadow-md">
              KUNJUNGI KAMI
            </h3>
            <p className="text-xs md:text-sm max-w-md font-light text-gray-100 mb-6 leading-relaxed drop-shadow-md">
              Rasakan kualitasnya secara langsung. Temukan gerai C-Merch terdekat di pusat-pusat transportasi utama.
            </p>

            <div className="flex items-center gap-3">
              <button className="border border-white/80 bg-black/30 hover:bg-white/20 backdrop-blur-sm text-white text-xs md:text-sm font-semibold py-2.5 px-5 md:py-3 md:px-6 rounded-none flex items-center gap-2 transition cursor-pointer tracking-wider">
                <MapPin size={16} /> TEMUKAN TOKO KAMI
              </button>

              <button className="bg-white hover:bg-gray-100 text-gray-900 p-2.5 md:p-3 rounded-lg transition shadow-md cursor-pointer flex items-center justify-center">
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="mt-auto bg-white border-t border-gray-200 pt-10 pb-6 px-4 md:px-6 text-xs text-gray-600 w-full">
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

export default HomePage;