import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Search, 
  User, 
  Heart, 
  ShoppingBag, 
  ChevronDown, 
  ChevronUp,
  ChevronRight, 
  Star, 
  X, 
  Loader2 
} from 'lucide-react';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // State Data dari Database
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // State Varian Terpilih & Harga Dinamis
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [selectedImage, setSelectedImage] = useState('');

  // State Action & Loading
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  // State Interface UI
  const [isInfoOpen, setIsInfoOpen] = useState(true);
  const [isSizeOpen, setIsSizeOpen] = useState(false);
  const [isReviewDrawerOpen, setIsReviewDrawerOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Helper Header Autentikasi (Ambil Token JWT dari LocalStorage)
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

  // Helper Pemetaan Warna Hex Bulat
  const getColorHex = (colorName) => {
    if (!colorName) return '#CBD5E1';
    const c = colorName.toLowerCase();
    if (c.includes('blue') || c.includes('sky') || c.includes('biru')) return '#A0C4FF';
    if (c.includes('white') || c.includes('broken') || c.includes('putih')) return '#EAE6DF';
    if (c.includes('grey') || c.includes('abu')) return '#D1D5DB';
    if (c.includes('black') || c.includes('hitam')) return '#1F2937';
    if (c.includes('pink') || c.includes('merah muda')) return '#FFADAD';
    if (c.includes('red') || c.includes('merah')) return '#E5231B';
    return '#CBD5E1';
  };

  // 1. Fetch Jumlah Cart Terkini dari Database
  const fetchCartCount = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/customer/cart', {
        headers: getAuthHeader()
      });

      const totalCount = res.data.summary?.total_items || (res.data.cart || []).reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(totalCount);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        setCartCount(0);
      } else {
        console.error("Gagal mengambil data keranjang:", error);
      }
    }
  };

  // 2. Fetch Detail Produk dari Database
  useEffect(() => {
    const fetchProductDetail = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:5001/api/customer/products/${id || 1}`);
        const data = response.data;

        const prodData = data.product || data;
        const varData = data.variants || [];

        setProduct(prodData);
        setVariants(varData);
        setReviews(data.reviews || []);
        setRelatedProducts(data.related_products || []);

        // Default Gambar Utama
        const mainImg = prodData?.image_url || '/assets/images/product-placeholder.jpg';
        setSelectedImage(mainImg);

        // Default Varian Terpilih
        if (varData.length > 0) {
          const firstVar = varData[0];
          setSelectedColor(firstVar.color || '');
          setSelectedSize(firstVar.size || '');
          setSelectedVariantId(firstVar.id || null);
          setCurrentPrice(Number(firstVar.price || prodData?.price || 0));
        } else {
          setCurrentPrice(Number(prodData?.price || 0));
        }

        fetchCartCount();

      } catch (error) {
        console.error("Gagal memuat detail produk dari DB:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetail();
  }, [id]);

  // 3. Update Varian Terpilih & Harga Dinamis saat Kombinasi Diubah
  useEffect(() => {
    if (variants.length > 0) {
      const matchedVariant = variants.find(v => {
        const matchColor = !selectedColor || v.color === selectedColor;
        const matchSize = !selectedSize || v.size === selectedSize;
        return matchColor && matchSize;
      });

      if (matchedVariant) {
        setSelectedVariantId(matchedVariant.id || null);
        if (matchedVariant.price) {
          setCurrentPrice(Number(matchedVariant.price));
        }
      } else if (product?.price) {
        setCurrentPrice(Number(product.price));
      }
    }
  }, [selectedColor, selectedSize, variants, product]);

  // 4. FUNGSI SIMPAN KE DATABASE KERANJANG
  const handleAddToCart = async () => {
    if (!product) return;

    try {
      setIsAddingToCart(true);

      const payload = {
        product_id: product.id,
        variant_id: selectedVariantId || null,
        quantity: 1
      };

      const res = await axios.post('http://localhost:5001/api/customer/cart', payload, {
        headers: getAuthHeader()
      });

      await fetchCartCount();
      alert(res.data.message || "Berhasil ditambahkan ke keranjang!");
    } catch (error) {
      console.error("Gagal menambahkan ke keranjang DB:", error);
      if (error.response && error.response.status === 401) {
        if (window.confirm("Silakan login terlebih dahulu untuk menambahkan produk ke keranjang. Ke halaman login sekarang?")) {
          navigate('/auth');
        }
      } else {
        alert("Terjadi kesalahan saat menyimpan ke keranjang. Coba lagi.");
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-gray-500 gap-2 font-sans">
        <Loader2 className="animate-spin text-red-600" size={28} />
        <span className="text-sm font-semibold">Memuat Detail Produk...</span>
      </div>
    );
  }

  const uniqueColors = Array.from(new Set(variants.map(v => v.color).filter(Boolean)));
  const uniqueSizes = Array.from(new Set(variants.map(v => v.size).filter(Boolean)));

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800 flex flex-col w-full relative">
      
      {/* 1. HEADER NAVIGATION */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 w-full shadow-sm">
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
              <Link to="/products?segment=Anak-anak" className="flex items-center gap-1.5 text-gray-800 hover:text-red-600 font-bold">
                Anak - Anak <ChevronDown size={16} />
              </Link>

              {isCategoryOpen && (
                <div className="absolute top-full left-0 w-[500px] bg-white border border-gray-200 shadow-xl rounded-2xl p-6 grid grid-cols-2 gap-6 text-left normal-case z-50">
                  <div>
                    <h4 className="font-bold text-base text-gray-900 mb-3 border-b pb-1">Kategori Anak-Anak</h4>
                    <ul className="space-y-2.5 text-sm font-normal text-gray-600">
                      <li><Link to="/products?segment=Anak-anak&category=Pakaian" className="hover:text-red-600">Pakaian & Kaos</Link></li>
                      <li><Link to="/products?segment=Anak-anak&category=Topi" className="hover:text-red-600">Topi & Aksesoris</Link></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-gray-900 mb-3 border-b pb-1">Kategori Dewasa</h4>
                    <ul className="space-y-2.5 text-sm font-normal text-gray-600">
                      <li><Link to="/products?segment=Dewasa&category=Pakaian" className="hover:text-red-600">T-Shirt & Outerwear</Link></li>
                      <li><Link to="/products?segment=Dewasa&category=Tote%20Bag" className="hover:text-red-600">Tas & Tote Bag</Link></li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <Link to="/products?segment=Dewasa" className="hover:text-red-600">Dewasa</Link>
            <Link to="/products" className="hover:text-red-600">Semua Produk</Link>
          </nav>

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
            <Link to="/cart" className="hover:text-red-600 relative">
              <ShoppingBag size={26} />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* 2. BREADCRUMB */}
      <div className="pt-[105px] md:pt-[115px] px-8 md:px-12 py-4 bg-white text-xs font-semibold text-gray-500 flex items-center gap-2">
        <Link to="/" className="hover:text-red-600">Beranda</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-red-600">Semua Produk</Link>
        <span>/</span>
        <span className="text-red-600 font-bold">{product?.name}</span>
      </div>

      {/* 3. MAIN CONTENT DETAIL PRODUK */}
      <div className="w-full px-8 md:px-12 py-6 grid grid-cols-1 md:grid-cols-12 gap-10">
        
        {/* GALERI FOTO (KIRI) */}
        <div className="md:col-span-6 flex flex-col gap-4">
          <div className="w-full aspect-square bg-[#F3F4F6] rounded-xl p-8 flex items-center justify-center overflow-hidden">
            <img 
              src={selectedImage} 
              alt={product?.name} 
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex gap-4">
            {[product?.image_url].filter(Boolean).map((img, idx) => (
              <button 
                key={idx}
                onClick={() => setSelectedImage(img)}
                className={`w-24 h-24 bg-[#F3F4F6] rounded-lg p-2 border-2 transition overflow-hidden cursor-pointer ${
                  selectedImage === img ? 'border-red-600' : 'border-transparent hover:border-gray-300'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-contain" />
              </button>
            ))}
          </div>
        </div>

        {/* SPESIFIKASI & AKSI (KANAN) */}
        <div className="md:col-span-6 flex flex-col gap-5 text-gray-800">
          <div>
            <span className="text-red-600 font-bold text-xs uppercase tracking-wider block mb-1">C-Merch Official</span>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">{product?.name}</h1>
            
            <p className="text-xl font-extrabold text-[#E5231B] mt-2 transition-all">
              {formatRupiah(currentPrice)}
            </p>
            
            <p className="text-xs text-gray-400 font-medium mt-1">
              Kode Produk : <span className="text-gray-700 font-bold">{product?.product_code || '-'}</span>
            </p>
          </div>

          <hr className="border-gray-200" />

          {/* PEMILIHAN VARIAN */}
          <div className="flex gap-12">
            
            {/* Pilihan Warna */}
            {uniqueColors.length > 0 && (
              <div>
                <label className="text-xs font-bold uppercase text-gray-700 block mb-2">
                  Warna : <span className="text-gray-500 font-normal">{selectedColor}</span>
                </label>
                <div className="flex items-center gap-2.5">
                  {uniqueColors.map((col) => (
                    <button
                      key={col}
                      onClick={() => setSelectedColor(col)}
                      className={`w-7 h-7 rounded-full border-2 transition flex items-center justify-center cursor-pointer ${
                        selectedColor === col ? 'border-gray-800 scale-110 shadow-sm' : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: getColorHex(col) }}
                      title={col}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Pilihan Ukuran */}
            {uniqueSizes.length > 0 && (
              <div>
                <label className="text-xs font-bold uppercase text-gray-700 block mb-2">
                  Ukuran : <span className="text-gray-500 font-normal">{selectedSize}</span>
                </label>
                <div className="flex items-center gap-2">
                  {uniqueSizes.map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(sz)}
                      className={`min-w-[34px] h-8 px-2.5 rounded text-xs font-bold border transition cursor-pointer ${
                        selectedSize === sz 
                          ? 'bg-gray-900 text-white border-gray-900' 
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Tombol Keranjang & Wishlist */}
          <div className="flex items-center gap-3 pt-2">
            <button 
              onClick={handleAddToCart}
              disabled={isAddingToCart}
              className="flex-1 bg-[#E5231B] hover:bg-red-700 text-white font-extrabold text-sm py-3.5 px-6 rounded-lg transition shadow-md cursor-pointer text-center flex items-center justify-center gap-2 disabled:opacity-75"
            >
              {isAddingToCart ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Menambahkan...</span>
                </>
              ) : (
                <span>Tambahkan Ke Keranjang</span>
              )}
            </button>
            <button 
              onClick={() => setIsWishlisted(!isWishlisted)}
              className="p-3.5 rounded-lg border border-gray-300 hover:border-gray-400 transition cursor-pointer flex items-center justify-center"
            >
              <Heart size={20} className={isWishlisted ? "fill-red-600 text-red-600" : "text-gray-700"} />
            </button>
          </div>

          <hr className="border-gray-200 mt-2" />

          {/* ACCORDION INFO PRODUK & UKURAN/MATERIAL DINAMIS DARI DATABASE */}
          <div className="flex flex-col divide-y divide-gray-200 text-sm">
            
            {/* Informasi Produk */}
            <div className="py-3">
              <button 
                onClick={() => setIsInfoOpen(!isInfoOpen)}
                className="w-full flex justify-between items-center font-bold text-gray-900 text-xs uppercase tracking-wide cursor-pointer"
              >
                <span>Informasi Produk</span>
                {isInfoOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {isInfoOpen && (
                <p className="text-xs text-gray-600 leading-relaxed mt-2.5 whitespace-pre-line">
                  {product?.product_info || product?.description || 'Belum ada informasi detail untuk produk ini.'}
                </p>
              )}
            </div>

            {/* Ukuran & Material */}
            <div className="py-3">
              <button 
                onClick={() => setIsSizeOpen(!isSizeOpen)}
                className="w-full flex justify-between items-center font-bold text-gray-900 text-xs uppercase tracking-wide cursor-pointer"
              >
                <span>Ukuran & Material</span>
                {isSizeOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {isSizeOpen && (
                <div className="text-xs text-gray-600 space-y-1 mt-2.5 whitespace-pre-line">
                  {product?.size_material || 'Belum ada spesifikasi ukuran dan material.'}
                </div>
              )}
            </div>

          </div>

          <hr className="border-gray-200" />

          {/* RATING & REVIEWS */}
          <div>
            <h3 className="font-extrabold text-sm text-gray-900 uppercase tracking-wider mb-2">Rating & Reviews</h3>
            
            <div className="flex items-center gap-2 mb-4">
              <span className="text-base font-extrabold text-gray-900">
                {Number(product?.average_rating || 5.0).toFixed(1)}/5
              </span>
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-xs text-gray-400 font-medium">({reviews.length} reviews)</span>
            </div>

            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.slice(0, 2).map((rev, idx) => (
                  <div key={rev.id || idx} className="text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <div className="flex text-amber-400">
                        {[...Array(Number(rev.rating || 5))].map((_, i) => (
                          <Star key={i} size={12} className="fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <span className="text-[11px] text-gray-400">{rev.date || 'Terbaru'}</span>
                    </div>
                    <p className="font-bold text-gray-900">By {rev.user_name || 'Pelanggan C-Merch'}</p>
                    {rev.variant && <p className="text-gray-400 text-[11px]">Variasi : {rev.variant}</p>}
                    <p className="text-gray-700 leading-relaxed pt-0.5">{rev.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">Belum ada ulasan untuk produk ini.</p>
            )}

            {reviews.length > 0 && (
              <button 
                onClick={() => setIsReviewDrawerOpen(true)}
                className="text-[#E5231B] hover:underline text-xs font-bold flex items-center gap-1 mt-4 cursor-pointer"
              >
                Lihat Semua Review ({reviews.length}) <ChevronRight size={14} />
              </button>
            )}
          </div>

        </div>

      </div>

      {/* 4. PRODUK TERKAIT */}
      {relatedProducts.length > 0 && (
        <section className="w-full px-8 md:px-12 py-10 mt-6 border-t border-gray-100">
          <span className="text-[#E5231B] font-extrabold text-xs uppercase tracking-wider block mb-1">KAMU MUNGKIN JUGA SUKA</span>
          <h3 className="text-xl font-extrabold text-gray-900 uppercase tracking-tight mb-6">Produk Terkait</h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((item) => (
              <Link key={item.id} to={`/products/${item.id}`} className="group relative flex flex-col justify-between cursor-pointer">
                <div className="relative aspect-square bg-[#F3F4F6] rounded-lg p-4 flex items-center justify-center overflow-hidden">
                  <div className="absolute top-2 left-2 bg-gray-200/80 px-1.5 py-0.5 rounded text-[10px] font-bold text-gray-700 flex items-center gap-1">
                    <Star size={10} className="fill-amber-400 text-amber-400" />
                    <span>5.0</span>
                  </div>
                  <img src={item.image_url || '/assets/images/product-placeholder.jpg'} alt={item.name} className="w-full h-full object-contain group-hover:scale-105 transition" />
                </div>
                <div className="pt-2">
                  <h4 className="text-xs font-bold text-gray-900 line-clamp-1">{item.name}</h4>
                  <p className="text-xs font-extrabold text-[#E5231B]">{formatRupiah(item.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 5. POP-UP SIDE DRAWER REVIEW */}
      {isReviewDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsReviewDrawerOpen(false)}
          />

          <div className="relative w-full max-w-md bg-white h-full shadow-2xl z-10 flex flex-col p-6 overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
              <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
                <X 
                  size={20} 
                  className="cursor-pointer text-gray-600 hover:text-red-600" 
                  onClick={() => setIsReviewDrawerOpen(false)} 
                />
                Rating & Reviews
              </h3>
            </div>

            <div className="flex gap-4 py-4 border-b border-gray-100 items-center">
              <img 
                src={selectedImage} 
                alt="" 
                className="w-16 h-16 object-contain bg-[#F3F4F6] rounded-lg p-1"
              />
              <div>
                <h4 className="text-xs font-bold text-gray-900 leading-snug">{product?.name}</h4>
                <p className="text-xs font-extrabold text-[#E5231B] mt-1">{formatRupiah(currentPrice)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 py-3 border-b border-gray-100">
              <span className="text-sm font-extrabold text-gray-900">
                {Number(product?.average_rating || 5.0).toFixed(1)}/5
              </span>
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-xs text-gray-400 font-medium">({reviews.length} reviews)</span>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-5 divide-y divide-gray-100">
              {reviews.map((rev, idx) => (
                <div key={rev.id || idx} className="pt-4 first:pt-0 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <div className="flex text-amber-400">
                      {[...Array(Number(rev.rating || 5))].map((_, i) => (
                        <Star key={i} size={12} className="fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="text-[11px] text-gray-400">{rev.date || 'Terbaru'}</span>
                  </div>
                  <p className="font-bold text-gray-900">By {rev.user_name || 'Pelanggan C-Merch'}</p>
                  {rev.variant && <p className="text-gray-400 text-[11px]">Variasi : {rev.variant}</p>}
                  <p className="text-gray-700 leading-relaxed pt-1">{rev.comment}</p>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* 6. FOOTER */}
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
              <li><Link to="/products" className="hover:underline">Kategori</Link></li>
              <li><Link to="/products" className="hover:underline">Produk Terbaru</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-gray-900 mb-3">BANTUAN</h5>
            <ul className="space-y-2 text-gray-500">
              <li><a href="#faq" className="hover:underline">FAQ</a></li>
              <li><a href="#pengiriman" className="hover:underline">Pengiriman</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-gray-900 mb-3">PERUSAHAAN</h5>
            <ul className="space-y-2 text-gray-500">
              <li><a href="#lokasi" className="hover:underline">Lokasi Store</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-gray-900 mb-3">PEMBAYARAN</h5>
            <p className="text-[11px] text-gray-500 mb-2">Mendukung E-Wallet & Bank Transfer Mandiri, BCA, BRI, QRIS.</p>
          </div>
        </div>
        <div className="w-full border-t border-gray-200 pt-6 flex justify-between items-center text-[11px] text-gray-400">
          <p>© 2026 C-Merch Official Store. Seluruh hak cipta dilindungi.</p>
        </div>
      </footer>

    </div>
  );
};

export default ProductDetailPage;