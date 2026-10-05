import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  User, 
  Heart, 
  ShoppingBag, 
  ChevronDown 
} from 'lucide-react';

const WishlistPage = () => {
  const navigate = useNavigate();
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  // State Item Wishlist (Contoh Data Default Berisi 1 Produk)
  const [wishlistItems, setWishlistItems] = useState([
    {
      id: 1,
      name: 'T-Shirt Anak - Train Brothers',
      price: 100000,
      variantsCount: 3,
      image: '/assets/images/product-placeholder.jpg'
    }
  ]);

  // Helper Format Rupiah
  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(number || 0).replace('IDR', 'Rp');
  };

  // Fungsi Hapus dari Wishlist saat Ikon Hati Diklik
  const removeFromWishlist = (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlistItems(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800 flex flex-col w-full">
      
      {/* 1. MAIN HEADER NAVIGATION */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 w-full shadow-sm">
        <div className="w-full px-8 md:px-12 py-5 md:py-6 flex items-center justify-between gap-10">
          <Link to="/" className="shrink-0">
            <img src="/assets/images/logo-cmerch.svg" alt="C-Merch" className="h-10 md:h-12 w-auto object-contain" />
          </Link>

          <nav className="flex items-center gap-8 font-bold text-sm md:text-base uppercase tracking-wide text-gray-800">
            <Link to="/" className="hover:text-red-600">Beranda</Link>
            
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
            <Link to="/products" className="hover:text-red-600">Semua Produk</Link>
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

          <div className="flex items-center gap-6 text-gray-800">
            <a href="/auth" className="hover:text-red-600"><User size={26} /></a>
            <Link to="/wishlist" className="text-red-600 relative">
              <Heart size={26} className="fill-red-600 text-red-600" />
              {wishlistItems.length > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {wishlistItems.length}
                </span>
              )}
            </Link>
            <Link to="/cart" className="hover:text-red-600 relative">
              <ShoppingBag size={26} />
              <span className="absolute -top-1.5 -right-2 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">0</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. BREADCRUMB & HEADER JUDUL */}
      <div className="pt-[105px] md:pt-[115px] px-8 md:px-12 py-4 bg-white">
        <div className="text-xs font-semibold text-gray-500 flex items-center gap-2 mb-2">
          <Link to="/" className="hover:text-red-600">Beranda</Link>
          <span>/</span>
          <span className="text-red-600 font-bold">Wishlist</span>
        </div>
        {wishlistItems.length > 0 && (
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Wishlist Saya</h1>
        )}
      </div>

      {/* 3. CONTENT WISHLIST */}
      <main className="flex-1 w-full px-8 md:px-12 py-6">
        {wishlistItems.length === 0 ? (
          
          /* KONDISI 1: WISHLIST KOSONG (FOTO 1) */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            
            {/* Circle Icon Double Heart */}
            <div className="w-28 h-28 bg-gray-200 rounded-full flex items-center justify-center mb-6 text-gray-500 relative">
              <svg 
                className="w-14 h-14 text-gray-600" 
                viewBox="0 0 24 24" 
                fill="currentColor"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>

            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Wishlist kamu masih kosong</h2>
            <p className="text-sm font-semibold text-gray-500 mb-8 max-w-md">
              Simpan produk favoritmu disini supaya mudah ditemukan lagi
            </p>

            <button 
              onClick={() => navigate('/products')}
              className="bg-[#E5231B] hover:bg-red-700 text-white font-extrabold text-sm py-3.5 px-14 rounded-md transition shadow-md cursor-pointer"
            >
              Mulai Belanja
            </button>
          </div>

        ) : (

          /* KONDISI 2: WISHLIST BERISI PRODUK (FOTO 2) */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 items-start">
            {wishlistItems.map((item) => (
              <div 
                key={item.id} 
                className="group relative flex flex-col justify-between cursor-pointer"
                onClick={() => navigate(`/products/${item.id}`)}
              >
                {/* Image Container */}
                <div className="relative aspect-square bg-[#F3F4F6] rounded-md p-4 flex items-center justify-center overflow-hidden">
                  
                  {/* Tombol Heart Terisi Merah (Di-unfavorite saat diklik) */}
                  <button 
                    onClick={(e) => removeFromWishlist(item.id, e)}
                    className="absolute top-3 right-3 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-sm z-10 transition transform active:scale-95 cursor-pointer"
                    title="Hapus dari wishlist"
                  >
                    <Heart size={18} className="fill-red-600 text-red-600" />
                  </button>

                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-full h-full object-contain group-hover:scale-105 transition duration-300" 
                  />
                </div>

                {/* Deskripsi Informasi Produk */}
                <div className="pt-3 pb-2 flex flex-col justify-between">
                  <h3 className="text-xs font-bold text-gray-900 line-clamp-1 mb-1">{item.name}</h3>
                  <p className="text-sm font-extrabold text-[#E5231B] mb-1">
                    {formatRupiah(item.price)}
                  </p>
                  <p className="text-[11px] font-medium text-gray-400">
                    {item.variantsCount} varian
                  </p>
                </div>
              </div>
            ))}
          </div>

        )}
      </main>

      {/* 4. FOOTER */}
      <footer className="mt-auto bg-[#EAEAEA] border-t border-gray-200 pt-10 pb-6 px-8 md:px-12 text-xs text-gray-600 w-full">
        <div className="w-full grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
          <div>
            <img src="/assets/images/logo-cmerch.svg" alt="C-Merch" className="h-8 w-auto mb-4 object-contain" />
            <p className="text-[11px] leading-relaxed text-gray-500">
              Merchandise resmi Commuter Line — tote bag, apparel, aksesoris, hingga koleksi tumbler, terinspirasi dari perjalanan harianmu di atas rel.
            </p>
          </div>
          <div>
            <h5 className="font-bold text-gray-900 mb-3">BELANJA</h5>
            <ul className="space-y-2 text-gray-500">
              <li><Link to="/products" className="hover:underline">Tote Bag</Link></li>
              <li><Link to="/products" className="hover:underline">Botol Minum</Link></li>
              <li><Link to="/products" className="hover:underline">Kaos Kaki</Link></li>
              <li><Link to="/products" className="hover:underline">Pakaian</Link></li>
              <li><Link to="/products" className="hover:underline">Gantungan Kunci</Link></li>
              <li><Link to="/products" className="hover:underline">Aksesoris Rumah</Link></li>
              <li><Link to="/products" className="hover:underline">Buku & lainnya</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-gray-900 mb-3">BANTUAN</h5>
            <ul className="space-y-2 text-gray-500">
              <li><a href="#hubungi" className="hover:underline">Hubungi Kami</a></li>
              <li><a href="#pembayaran" className="hover:underline">Cara Pembayaran</a></li>
              <li><a href="#pengiriman" className="hover:underline">Pengiriman</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-gray-900 mb-3">PERUSAHAAN</h5>
            <ul className="space-y-2 text-gray-500">
              <li><a href="#lokasi" className="hover:underline">Lokasi Store</a></li>
              <li><a href="#syarat" className="hover:underline">Syarat & Ketentuan</a></li>
              <li><a href="#privasi" className="hover:underline">Kebijakan Privasi</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-gray-900 mb-3">AKUN</h5>
            <ul className="space-y-2 text-gray-500">
              <li><a href="#profil" className="hover:underline">Profil Saya</a></li>
              <li><a href="#pesanan" className="hover:underline">Pesanan Saya</a></li>
              <li><Link to="/wishlist" className="hover:underline">Wishlist</Link></li>
              <li><Link to="/cart" className="hover:underline">Keranjang</Link></li>
            </ul>
          </div>
        </div>
        <div className="w-full border-t border-gray-300 pt-6 flex justify-between items-center text-[11px] text-gray-500">
          <p>© 2026 C-Merch Official Store. Seluruh hak cipta dilindungi.</p>
          <div className="flex gap-4">
            <a href="#syarat" className="hover:underline">Syarat & Ketentuan</a>
            <a href="#privasi" className="hover:underline">Kebijakan Privasi</a>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default WishlistPage;