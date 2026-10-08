import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { 
  Search, 
  User, 
  Heart, 
  ShoppingBag, 
  ChevronDown, 
  Download,
  Loader2,
  Clock,
  CheckCircle2
} from 'lucide-react';

const PaymentPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderIdParam = searchParams.get('order_id');

  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  // State Data Order dari Database
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Countdown Timer
  const [timeLeft, setTimeLeft] = useState(86399);

  // State Pengecekan Mutasi (idle | checking | unpaid | success)
  const [checkStatus, setCheckStatus] = useState('idle');
  const [lastCheckedTime, setLastCheckedTime] = useState('');

  // Helper Auth Header
  const getAuthHeader = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('customer_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Format Rupiah
  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(number || 0).replace('IDR', 'Rp');
  };

  // 1. FETCH DETAIL PEMBAYARAN DARI BACKEND
  useEffect(() => {
    if (!orderIdParam) {
      alert('Order ID tidak ditemukan.');
      navigate('/');
      return;
    }

    const fetchPaymentDetail = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`http://localhost:5001/api/customer/payment/${orderIdParam}`, {
          headers: getAuthHeader()
        });

        const data = res.data;
        setOrderData(data);
        setTimeLeft(data.time_remaining_seconds || 86399);

        // Jika pesanan di database sudah lunas
        if (data.status === 'paid' || data.status === 'Sudah Dibayar' || data.status === 'completed') {
          setCheckStatus('success');
        }
      } catch (error) {
        console.error('Gagal mengambil detail pembayaran:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentDetail();
  }, [orderIdParam, navigate]);

  // Countdown Interval
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const hrs = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const secs = String(seconds % 60).padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  // 2. FUNGSI CEK STATUS PEMBAYARAN AUTOMATIS VIA API
  const handleCheckStatus = async (forceSuccess = false) => {
    try {
      setCheckStatus('checking');

      const res = await axios.post(
        `http://localhost:5001/api/customer/payment/${orderIdParam}/check-status`,
        { force_success: forceSuccess },
        { headers: getAuthHeader() }
      );

      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      setLastCheckedTime(timeStr);

      if (res.data.is_paid) {
        setCheckStatus('success');
        if (orderData) {
          setOrderData({ ...orderData, status: 'paid' });
        }
      } else {
        setCheckStatus('unpaid');
      }
    } catch (error) {
      console.error('Gagal verifikasi pembayaran:', error);
      setCheckStatus('unpaid');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-gray-500 gap-2 font-sans">
        <Loader2 className="animate-spin text-red-600" size={28} />
        <span className="text-sm font-semibold">Memuat Halaman Pembayaran...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800 flex flex-col w-full">
      
      {/* 1. HEADER NAVIGATION */}
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

          <div className="flex-grow max-w-lg relative">
            <input 
              type="text" 
              placeholder="Apa yang anda cari?" 
              className="w-full bg-gray-100 rounded-full py-3.5 pl-6 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-red-600"
            />
            <Search className="absolute right-4 top-4 text-gray-400" size={18} />
          </div>

          <div className="flex items-center gap-6 text-gray-800">
            <Link to="/account" className="hover:text-red-600"><User size={26} /></Link>
            <Link to="/wishlist" className="hover:text-red-600 relative"><Heart size={26} /></Link>
            <Link to="/cart" className="hover:text-red-600 relative">
              <ShoppingBag size={26} />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. MAIN CONTENT PEMBAYARAN */}
      <main className="pt-[105px] md:pt-[115px] flex-1 w-full px-8 md:px-12 py-8 bg-white">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* BANNER STATUS MENUNGGU PEMBAYARAN */}
          <div className="bg-[#EFEFEF] rounded-2xl p-6 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full shrink-0 ${checkStatus === 'success' ? 'bg-emerald-600' : 'bg-[#E5231B]'}`} />
              <div>
                <h1 className="text-lg font-black text-gray-900 tracking-tight">
                  {checkStatus === 'success' ? 'Pembayaran Berhasil' : 'Menunggu Pembayaran'}
                </h1>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  {checkStatus === 'success' ? 'Pesanan kamu telah lunas dan siap diproses.' : 'Selesaikan pembayaran sebelum batas waktu habis'}
                </p>
              </div>
            </div>
            <div className="text-xl md:text-2xl font-black text-[#E5231B] tracking-wider font-mono">
              {formatTime(timeLeft)}
            </div>
          </div>

          {/* GRID LAYOUT AREA PEMBAYARAN */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* SISI KIRI (8 KOLOM) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* CARD TAMPILAN QRIS */}
              <div className="border border-gray-300 rounded-2xl p-8 flex flex-col items-center text-center bg-white shadow-xs">
                <div className="bg-[#2D3748] text-white text-[11px] font-bold px-4 py-1 rounded-full mb-4 uppercase tracking-wider">
                  QRIS — Quick Response Code Indonesian Standard
                </div>

                <p className="text-sm font-bold text-gray-600 mb-1">Total Pembayaran</p>
                <p className="text-2xl font-black text-gray-900 mb-6 tracking-tight">
                  {formatRupiah(orderData?.total_amount)}
                </p>

                {/* Kode QR Code */}
                <div className="border-2 border-gray-900 rounded-2xl p-4 bg-white mb-4 relative">
                  <img 
                    src={orderData?.qris_data?.qr_image_url} 
                    alt="Kode QRIS Pembayaran" 
                    className={`w-48 h-48 object-contain ${checkStatus === 'success' ? 'opacity-20 grayscale' : 'opacity-100'}`}
                  />
                  {checkStatus === 'success' && (
                    <div className="absolute inset-0 flex items-center justify-center font-black text-emerald-600 text-lg">
                      LUNAS
                    </div>
                  )}
                </div>

                <p className="text-xs font-bold text-gray-800">
                  Merchant : <span className="font-black">{orderData?.merchant_name || 'C-Merch Official Store'}</span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5 mb-5 font-medium">
                  No. Pesanan: <span className="font-bold text-gray-700">{orderData?.order_code}</span>
                </p>

                {/* Tombol Download QRIS */}
                <a 
                  href={orderData?.qris_data?.qr_image_url} 
                  target="_blank" 
                  rel="noreferrer"
                  download="QRIS-CMerch.png"
                  className="border border-gray-900 hover:bg-gray-50 text-gray-900 font-extrabold text-xs py-2.5 px-6 rounded-lg transition flex items-center gap-2 cursor-pointer mb-6"
                >
                  <Download size={16} /> Download QRIS
                </a>

                {/* Badge Pilihan E-Wallet */}
                <div className="flex flex-wrap justify-center gap-2.5">
                  {['Gopay', 'OVO', 'DANA', 'ShopeePay', 'M-Banking'].map((app) => (
                    <span key={app} className="bg-gray-200 text-gray-800 text-[11px] font-bold px-3.5 py-1.5 rounded-lg">
                      {app}
                    </span>
                  ))}
                </div>
              </div>

              {/* PETUNJUK CARA PEMBAYARAN */}
              <div className="space-y-2">
                <h3 className="text-sm font-black text-gray-900">Cara Pembayaran Dengan QRIS</h3>
                <ol className="list-decimal list-inside text-xs text-gray-600 space-y-1.5 leading-relaxed font-medium">
                  <li>Buka aplikasi e-wallet atau mobile banking apa pun yang sudah mendukung QRIS.</li>
                  <li>Pilih menu Scan / Bayar QR, lalu arahkan kamera ke kode QR di atas (atau unggah file hasil Download QRIS).</li>
                  <li>Periksa nama merchant "C-Merch Official Store" dan pastikan nominal sesuai total pembayaran.</li>
                  <li>Masukkan PIN untuk menyelesaikan pembayaran. Struk pembayaran akan tersimpan di aplikasi kamu.</li>
                </ol>
              </div>

              {/* PETUNJUK LANGKAH SELANJUTNYA */}
              <div className="bg-[#F2F3F5] rounded-2xl p-6">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-900 mb-4">
                  LANGKAH SELANJUTNYA SETELAH TRANSFER
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#1E293B] text-white text-xs font-extrabold flex items-center justify-center shrink-0">1</span>
                    <div>
                      <p className="text-xs font-extrabold text-gray-900 leading-snug">Scan & bayar lewat aplikasi QRIS pilihanmu</p>
                      <p className="text-[11px] text-gray-500 mt-1">Pastikan nominal sesuai total pembayaran</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#1E293B] text-white text-xs font-extrabold flex items-center justify-center shrink-0">2</span>
                    <div>
                      <p className="text-xs font-extrabold text-gray-900 leading-snug">Cek status secara otomatis <span className="font-normal text-gray-500">(opsional)</span></p>
                      <p className="text-[11px] text-gray-500 mt-1">Sistem memeriksa notifikasi pembayaran QRIS</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#1E293B] text-white text-xs font-extrabold flex items-center justify-center shrink-0">3</span>
                    <div>
                      <p className="text-xs font-extrabold text-gray-900 leading-snug">Status berubah "Sudah Dibayar"</p>
                      <p className="text-[11px] text-gray-500 mt-1">Kamu diarahkan ke halaman Lacak Pesanan</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* AREA TOMBOL CEK STATUS & HASIL MUTASI */}
              <div className="space-y-4 pt-2">
                
                {/* 1. STATE BILA PEMBAYARAN SUDAH BERHASIL */}
                {checkStatus === 'success' ? (
                  <div className="bg-[#D1FAE5] border border-emerald-300 rounded-2xl p-8 flex flex-col items-center text-center space-y-4 animate-fade-in">
                    <div className="w-14 h-14 bg-[#10B981] rounded-full flex items-center justify-center text-white shadow-md">
                      <CheckCircle2 size={32} />
                    </div>

                    <div>
                      <h3 className="text-base font-extrabold text-gray-900">Pembayaran Terdeteksi & Berhasil</h3>
                      <p className="text-xs text-gray-600 mt-1 font-medium">
                        Sistem menemukan mutasi yang cocok dengan No. Pesanan <span className="font-bold text-gray-900">{orderData?.order_code}</span>
                      </p>
                    </div>

                    <div className="w-full max-w-md bg-white rounded-xl p-4 text-xs space-y-2 border border-emerald-200">
                      <div className="flex justify-between text-gray-600">
                        <span>Metode Pembayaran</span>
                        <span className="font-extrabold text-gray-900">QRIS (Lunas)</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Jumlah yang dibayar</span>
                        <span className="font-extrabold text-gray-900">{formatRupiah(orderData?.total_amount)}</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => navigate('/account')}
                      className="w-full max-w-md bg-[#E5231B] hover:bg-red-700 text-white font-extrabold text-xs py-3.5 rounded-xl transition shadow-md cursor-pointer"
                    >
                      Lanjutkan Ke Lacak Pesanan
                    </button>
                  </div>
                ) : (

                  /* 2. STATE DEFAULT, LOADING, ATAU UNPAID */
                  <>
                    <button 
                      onClick={() => handleCheckStatus(false)}
                      disabled={checkStatus === 'checking'}
                      className={`w-full py-3.5 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 cursor-pointer ${
                        checkStatus === 'checking'
                          ? 'bg-[#D1D5DB] text-gray-700 border-transparent cursor-not-allowed'
                          : 'border border-gray-900 text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      {checkStatus === 'checking' ? (
                        <>
                          <Loader2 size={16} className="animate-spin text-gray-600" />
                          <span>Memeriksa Mutasi Bank...</span>
                        </>
                      ) : (
                        <span>Cek Status Pembayaran otomatis</span>
                      )}
                    </button>

                    {/* Alert jika Belum Terdeteksi */}
                    {(checkStatus === 'unpaid' || (checkStatus === 'checking' && lastCheckedTime)) && (
                      <div className="bg-[#FEF3C7] border border-amber-300 rounded-2xl p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                          <Clock size={20} />
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-amber-950">Pembayaran belum terdeteksi</h4>
                          <p className="text-[11px] text-amber-900 mt-0.5">
                            Terakhir diperiksa pukul {lastCheckedTime || 'sekarang'}. Transfer biasanya terverifikasi otomatis dalam 1-3 menit setelah dana kami terima.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="relative flex py-2 items-center">
                      <div className="flex-grow border-t border-gray-300"></div>
                      <span className="flex-shrink mx-4 text-xs font-bold text-gray-400">ATAU</span>
                      <div className="flex-grow border-t border-gray-300"></div>
                    </div>

                    <button 
                      onClick={() => handleCheckStatus(true)}
                      className="w-full bg-[#E5231B] hover:bg-red-700 text-white font-extrabold text-xs py-4 rounded-xl transition shadow-md cursor-pointer uppercase tracking-wider"
                    >
                      Saya Sudah Melakukan Pembayaran
                    </button>
                  </>
                )}

              </div>

            </div>

            {/* SISI KANAN: RINGKASAN PESANAN (4 KOLOM) */}
            <div className="lg:col-span-4 bg-[#F2F3F5] rounded-2xl p-6 space-y-5">
              <h3 className="text-sm font-black text-gray-900">Ringkasan Pesanan</h3>

              {/* Detail Item Produk */}
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {orderData?.order_items?.map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-center pb-4 border-b border-gray-200">
                    <div className="w-16 h-16 bg-white rounded-xl p-1.5 border border-gray-200 shrink-0 flex items-center justify-center">
                      <img 
                        src={item.image_url || '/assets/images/product-placeholder.jpg'} 
                        alt={item.product_name} 
                        className="w-full h-full object-contain" 
                      />
                    </div>
                    <div className="flex-1 flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-extrabold text-gray-900">{item.product_name}</h4>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {item.color_name ? `${item.color_name} ` : ''}{item.size ? `(${item.size})` : ''} x{item.quantity}
                        </p>
                      </div>
                      <span className="text-xs font-extrabold text-gray-900">
                        {formatRupiah(Number(item.price) * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Subtotal & Pengiriman */}
              <div className="space-y-3 text-xs text-gray-700 pb-5 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <span>Subtotal</span>
                  <span className="font-bold text-gray-900">{formatRupiah(orderData?.subtotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Pengiriman ({orderData?.shipping_courier || 'Kurir'})</span>
                  <span className="font-bold text-gray-900">{formatRupiah(orderData?.shipping_cost)}</span>
                </div>
              </div>

              {/* Total Akhir */}
              <div className="flex justify-between items-center text-sm font-black text-gray-900">
                <span>Total</span>
                <span>{formatRupiah(orderData?.total_amount)}</span>
              </div>
            </div>

          </div>

        </div>
      </main>

    </div>
  );
};

export default PaymentPage;