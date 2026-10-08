import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Search, 
  User, 
  Heart, 
  ShoppingBag, 
  ChevronDown, 
  Minus, 
  Plus, 
  Trash2,
  Loader2 
} from 'lucide-react';

const CartPage = () => {
  const navigate = useNavigate();
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  // State Data dari Database Backend
  const [cartItems, setCartItems] = useState([]);
  const [summary, setSummary] = useState({ total_items: 0, subtotal: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  // Helper Header Autentikasi JWT Token
  const getAuthHeader = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('customer_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Helper Format Rupiah
  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(number || 0).replace('IDR', 'Rp');
  };

  // 1. FETCH DATA KERANJANG DARI DATABASE BACKEND
  const fetchCartData = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5001/api/customer/cart', {
        headers: getAuthHeader()
      });

      const items = res.data.cart || [];
      const sum = res.data.summary || {
        total_items: items.reduce((acc, item) => acc + item.quantity, 0),
        subtotal: items.reduce((acc, item) => acc + Number(item.subtotal || item.price * item.quantity), 0),
        total: items.reduce((acc, item) => acc + Number(item.subtotal || item.price * item.quantity), 0)
      };

      setCartItems(items);
      setSummary(sum);
    } catch (error) {
      console.error('Gagal memuat data keranjang dari DB:', error);
      if (error.response && error.response.status === 401) {
        setCartItems([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCartData();
  }, []);

  // 2. FUNGSI UPDATE KUANTITAS ITEM (PUT DATABASE)
  const updateQuantity = async (cartId, action) => {
    try {
      setUpdatingId(cartId);
      
      await axios.put(`http://localhost:5001/api/customer/cart/${cartId}`, { action }, {
        headers: getAuthHeader()
      });

      await fetchCartData();
    } catch (error) {
      console.error('Gagal memperbarui kuantitas:', error);
      alert('Gagal memperbarui kuantitas produk.');
    } finally {
      setUpdatingId(null);
    }
  };

  // 3. FUNGSI HAPUS ITEM DARI KERANJANG (DELETE DATABASE)
  const removeItem = async (cartId) => {
    if (!confirm("Apakah kamu yakin ingin menghapus produk ini dari keranjang?")) return;

    try {
      setUpdatingId(cartId);

      await axios.delete(`http://localhost:5001/api/customer/cart/${cartId}`, {
        headers: getAuthHeader()
      });

      await fetchCartData();
    } catch (error) {
      console.error('Gagal menghapus item dari keranjang:', error);
      alert('Gagal menghapus produk dari keranjang.');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-gray-500 gap-2 font-sans">
        <Loader2 className="animate-spin text-red-600" size={28} />
        <span className="text-sm font-semibold">Memuat Keranjang Belanja...</span>
      </div>
    );
  }

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
            <Link to="/auth" className="hover:text-red-600"><User size={26} /></Link>
            <Link to="/wishlist" className="hover:text-red-600 relative"><Heart size={26} /></Link>
            <Link to="/cart" className="text-red-600 relative">
              <ShoppingBag size={26} />
              {summary.total_items > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {summary.total_items}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* 2. BREADCRUMB & HEADER JUDUL */}
      <div className="pt-[105px] md:pt-[115px] px-8 md:px-12 py-4 bg-white">
        <div className="text-xs font-semibold text-gray-500 flex items-center gap-2 mb-2">
          <Link to="/" className="hover:text-red-600">Beranda</Link>
          <span>/</span>
          <span className="text-red-600 font-bold">Keranjang</span>
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Keranjang Belanja</h1>
      </div>

      {/* 3. CONTENT KERANJANG */}
      <main className="flex-1 w-full px-8 md:px-12 py-6">
        {cartItems.length === 0 ? (
          
          /* KONDISI 1: KERANJANG KOSONG */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-28 h-28 bg-gray-200 rounded-full flex items-center justify-center mb-6 text-gray-600">
              <ShoppingBag size={48} strokeWidth={1.5} />
            </div>

            <h2 className="text-lg font-bold text-gray-900 mb-1">Keranjangmu masih kosong</h2>
            <p className="text-xs text-gray-500 mb-6">Yuk cari merchandise favoritmu dan mulai belanja</p>

            <button 
              onClick={() => navigate('/products')}
              className="bg-[#E5231B] hover:bg-red-700 text-white font-extrabold text-sm py-3 px-10 rounded-full transition shadow-md cursor-pointer"
            >
              Mulai Belanja
            </button>
          </div>

        ) : (

          /* KONDISI 2: KERANJANG BERISI PRODUK DARI DATABASE */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* TABEL DAFTAR ITEM (8 KOLOM) */}
            <div className="lg:col-span-8">
              
              {/* Header Kolom Tabel */}
              <div className="grid grid-cols-12 text-xs font-bold uppercase tracking-wider text-gray-900 border-b-2 border-gray-900 pb-3 mb-6">
                <div className="col-span-6">PRODUK</div>
                <div className="col-span-3 text-center">KUANTITAS</div>
                <div className="col-span-3 text-right">SUBTOTAL</div>
              </div>

              {/* Baris Daftar Item */}
              <div className="divide-y divide-gray-200 border-b border-gray-200 pb-6">
                {cartItems.map((item) => {
                  const isUpdating = updatingId === item.cart_id;

                  return (
                    <div key={item.cart_id} className="grid grid-cols-12 items-center py-4">
                      
                      {/* Gambar & Nama Produk */}
                      <div className="col-span-6 flex gap-4 items-center">
                        <div className="w-20 h-20 bg-[#F3F4F6] rounded-md p-2 shrink-0 flex items-center justify-center">
                          <img 
                            src={item.variant_image || item.product_image || '/assets/images/product-placeholder.jpg'} 
                            alt={item.product_name} 
                            className="w-full h-full object-contain" 
                          />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-gray-900 leading-snug">{item.product_name}</h3>
                          <div className="text-xs text-gray-500 mt-1 font-medium space-y-0.5">
                            {item.color_name && <p>Warna : {item.color_name}</p>}
                            {item.size && <p>Ukuran : {item.size}</p>}
                          </div>
                          <p className="text-xs font-extrabold text-[#E5231B] mt-1">{formatRupiah(item.price)}</p>
                        </div>
                      </div>

                      {/* Counter Kuantitas */}
                      <div className="col-span-3 flex justify-center">
                        <div className="flex items-center border border-gray-300 rounded-lg px-2 py-1 gap-3">
                          <button 
                            onClick={() => updateQuantity(item.cart_id, 'decrease')} 
                            disabled={isUpdating}
                            className="text-gray-600 hover:text-black cursor-pointer disabled:opacity-50"
                          >
                            <Minus size={12} />
                          </button>
                          
                          <span className="text-xs font-bold text-gray-900 w-4 text-center">
                            {isUpdating ? <Loader2 size={12} className="animate-spin mx-auto" /> : item.quantity}
                          </span>

                          <button 
                            onClick={() => updateQuantity(item.cart_id, 'increase')} 
                            disabled={isUpdating}
                            className="text-gray-600 hover:text-black cursor-pointer disabled:opacity-50"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Subtotal & Hapus Icon */}
                      <div className="col-span-3 flex items-center justify-end gap-4">
                        <span className="text-xs font-extrabold text-gray-900">
                          {formatRupiah(item.subtotal || item.price * item.quantity)}
                        </span>
                        <button 
                          onClick={() => removeItem(item.cart_id)} 
                          disabled={isUpdating}
                          className="text-gray-800 hover:text-red-600 transition cursor-pointer disabled:opacity-50"
                          title="Hapus dari keranjang"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>

            {/* RINGKASAN BELANJA (4 KOLOM) */}
            <div className="lg:col-span-4 bg-[#F3F4F6] p-6 rounded-xl space-y-4">
              <h3 className="text-sm font-bold text-gray-900">Ringkasan Belanja</h3>

              <div className="flex justify-between items-center text-xs text-gray-700 border-b border-gray-200 pb-3">
                <span>Subtotal ({summary.total_items} Barang)</span>
                <span className="font-semibold">{formatRupiah(summary.subtotal)}</span>
              </div>

              <div className="flex justify-between items-center text-sm font-extrabold text-gray-900 pt-1">
                <span>Total</span>
                <span>{formatRupiah(summary.total)}</span>
              </div>

              <button 
                onClick={() => navigate('/checkout')}
                className="w-full bg-[#334155] hover:bg-slate-800 text-white font-bold text-xs py-3.5 rounded-lg transition shadow cursor-pointer text-center block uppercase tracking-wider"
              >
                Checkout
              </button>
            </div>

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
            <h5 className="font-bold text-gray-900 mb-3">PEMBAYARAN</h5>
            <p className="text-[11px] text-gray-500 mb-2">Mendukung E-Wallet & Bank Transfer Mandiri, BCA, BRI, QRIS.</p>
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

export default CartPage;