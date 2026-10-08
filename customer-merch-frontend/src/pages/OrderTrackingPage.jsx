import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Search, 
  User, 
  Heart, 
  ShoppingBag, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp,
  Check,
  Copy,
  ArrowLeft,
  Star,
  Loader2
} from 'lucide-react';

const OrderTrackingPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedStep, setExpandedStep] = useState(1);
  const [copiedResi, setCopiedResi] = useState(false);

  // Helper Ambil Token Auth
  const getAuthHeader = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('customer_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // 1. Fetch Data Tracking Pesanan dari Backend Customer
  useEffect(() => {
    const fetchOrderDetail = async () => {
      try {
        setLoading(true);
        // Menggunakan orderId dari parameter URL (misal: /orders/1 atau /orders/CM747097)
        const response = await axios.get(`http://localhost:5001/api/customer/orders/${orderId || '1'}`, {
          headers: getAuthHeader()
        });

        console.log("Data Lacak Pesanan dari Backend:", response.data);
        setOrderData(response.data);
        
        // Otomatis expand step yang sedang aktif
        if (response.data.timeline) {
          const activeIndex = response.data.timeline.findIndex(t => t.active);
          if (activeIndex !== -1) {
            setExpandedStep(activeIndex + 1);
          }
        }
      } catch (error) {
        console.error("Gagal mengambil data pelacakan pesanan:", error);
        if (error.response && error.response.status === 401) {
          alert("Sesi login berakhir. Silakan login kembali.");
          navigate('/auth');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetail();
  }, [orderId, navigate]);

  const handleCopyResi = (resi) => {
    if (!resi) return;
    navigator.clipboard.writeText(resi);
    setCopiedResi(true);
    setTimeout(() => setCopiedResi(false), 2000);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Menunggu Pembayaran': return <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full">Menunggu Pembayaran</span>;
      case 'Sudah Dibayar': return <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">Sudah Dibayar</span>;
      case 'Pesanan Diproses': return <span className="bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1 rounded-full">Pesanan Diproses</span>;
      case 'Pesanan Dikirim': return <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-3 py-1 rounded-full">Pesanan Dikirim</span>;
      case 'Pesanan Diterima': return <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full">Pesanan Diterima</span>;
      default: return <span className="bg-gray-100 text-gray-800 text-xs font-bold px-3 py-1 rounded-full">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-gray-400 gap-2 font-sans">
        <Loader2 className="animate-spin text-red-600" size={24} />
        <span className="text-xs font-semibold">Memuat Status Pesanan...</span>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-gray-500 gap-4 font-sans">
        <p className="text-xs font-bold">Pesanan tidak ditemukan atau Anda tidak memiliki akses.</p>
        <Link to="/products" className="bg-[#E5231B] text-white px-4 py-2 rounded-lg text-xs font-bold">Kembali Belanja</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 flex flex-col w-full">
      
      {/* 1. HEADER NAVIGATION */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 w-full shadow-sm">
        <div className="w-full px-8 md:px-12 py-5 md:py-6 flex items-center justify-between gap-10">
          <Link to="/" className="shrink-0">
            <img src="/assets/images/logo-cmerch.svg" alt="C-Merch" className="h-10 md:h-12 w-auto object-contain" />
          </Link>

          <nav className="flex items-center gap-8 font-bold text-sm md:text-base uppercase tracking-wide text-gray-800">
            <Link to="/" className="hover:text-red-600">Beranda</Link>
            <Link to="/products?segment=Anak-anak" className="hover:text-red-600">Anak - Anak</Link>
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
              <span className="absolute -top-1.5 -right-2 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">0</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. MAIN CONTENT CONTAINER */}
      <main className="w-full max-w-5xl mx-auto pt-[120px] md:pt-[140px] px-4 md:px-6 pb-20 flex flex-col gap-6">
        
        {/* Tombol Kembali */}
        <Link to="/orders" className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-red-600 w-fit">
          <ArrowLeft size={16} /> Kembali ke Pesanan saya
        </Link>

        {/* Informasi Utama Pesanan */}
        <div className="flex justify-between items-start bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight">
              Pesanan {orderData.order_code}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Dibuat pada {new Date(orderData.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>
          <div>
            {getStatusBadge(orderData.current_status)}
          </div>
        </div>

        {/* TIMELINE LACAK PESANAN (Dinamis dari Backend Controller) */}
        <div className="bg-white p-6 md:p-8 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-6">
          <div className="space-y-6 relative before:absolute before:top-3 before:bottom-3 before:left-3.5 before:w-0.5 before:bg-gray-200">
            
            {orderData.timeline && orderData.timeline.map((t, idx) => {
              const stepNumber = idx + 1;
              const isExpanded = expandedStep === stepNumber;

              return (
                <div key={idx} className="relative pl-10">
                  <span className={`absolute left-0 top-1 w-7 h-7 rounded-full flex items-center justify-center z-10 text-white font-bold text-xs ${
                    t.completed ? (stepNumber === 5 ? 'bg-green-600' : 'bg-[#E5231B]') : 'bg-gray-300'
                  }`}>
                    {t.completed ? <Check size={14} /> : stepNumber}
                  </span>

                  <div 
                    onClick={() => setExpandedStep(isExpanded ? null : stepNumber)}
                    className="flex justify-between items-center cursor-pointer bg-gray-50/60 hover:bg-gray-50 p-4 rounded-lg border border-gray-100 transition"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 uppercase">{t.step}</h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {t.timestamp ? new Date(t.timestamp).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : 'Menunggu tahap selanjutnya'}
                      </p>
                    </div>
                    {isExpanded ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                  </div>

                  {/* Accordion Detail per Step */}
                  {isExpanded && (
                    <div className="mt-3 p-4 bg-gray-50 rounded-lg text-xs space-y-3 border border-gray-200">
                      
                      {/* Sub-steps jika ada (seperti Pesanan Diproses) */}
                      {t.sub_steps && t.sub_steps.map((sub, sIdx) => (
                        <div key={sIdx} className="flex items-center gap-2 text-gray-700">
                          <div className={`w-2 h-2 rounded-full ${sub.status === 'Selesai' ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <span>{sub.title}</span>
                        </div>
                      ))}

                      {/* Info Tracking Kurir jika ada (seperti Pesanan Dikirim) */}
                      {t.tracking_info && (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center bg-white p-3 rounded border border-gray-200">
                            <div>
                              <p className="text-[10px] text-gray-400 uppercase font-bold">Kurir Pengiriman</p>
                              <p className="font-bold text-gray-800">{t.tracking_info.courier}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-400 uppercase font-bold">Nomor Resi</p>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-800">{t.tracking_info.waybill_number}</span>
                                <button 
                                  onClick={() => handleCopyResi(t.tracking_info.waybill_number)}
                                  className="text-red-600 hover:text-red-700 flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                                >
                                  <Copy size={12} /> {copiedResi ? 'Disalin!' : 'Salin'}
                                </button>
                              </div>
                            </div>
                          </div>
                          {t.tracking_info.logs && t.tracking_info.logs.map((log, lIdx) => (
                            <p key={lIdx} className="text-gray-600">• {log.title} {log.location ? `(${log.location})` : ''}</p>
                          ))}
                        </div>
                      )}

                      {/* Info Penerima jika ada (Pesanan Diterima) */}
                      {t.recipient_info && (
                        <div className="space-y-1">
                          <p className="font-bold text-green-800">Diterima oleh: {t.recipient_info.received_by}</p>
                          <p className="text-green-700">{t.recipient_info.note}</p>
                        </div>
                      )}

                      {!t.sub_steps && !t.tracking_info && !t.recipient_info && (
                        <p className="text-gray-500">Informasi tahap pesanan tercatat dengan aman di sistem.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

          </div>
        </div>

        {/* JIKA STATUS SUDAH SELESAI */}
        {orderData.current_status === 'Pesanan Diterima' && (
          <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl flex items-center justify-between text-xs font-bold">
            <span>Pesanan telah selesai diterima. Terima kasih telah berbelanja di C-Merch!</span>
            <div className="flex gap-2">
              <Link to="/products" className="bg-white border border-green-300 px-3 py-1.5 rounded-lg hover:bg-green-100 transition flex items-center gap-1">
                <ShoppingBag size={14} /> Beli Lagi
              </Link>
              <button className="bg-[#E5231B] text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition flex items-center gap-1 cursor-pointer">
                <Star size={14} /> Beri Ulasan
              </button>
            </div>
          </div>
        )}

        {/* ALAMAT PENGIRIMAN & PEMBAYARAN (2 KOLOM) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-2">
            <h3 className="text-xs font-extrabold uppercase text-gray-900 tracking-wider">ALAMAT PENGIRIMAN</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              {orderData.shipping?.address || 'Alamat tidak tersedia'}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-2">
            <h3 className="text-xs font-extrabold uppercase text-gray-900 tracking-wider">PEMBAYARAN & PENGIRIMAN</h3>
            <p className="text-xs text-gray-700"><strong className="text-gray-900">Metode Pembayaran:</strong> {orderData.payment_method}</p>
            <p className="text-xs text-gray-700"><strong className="text-gray-900">Kurir Pengiriman:</strong> {orderData.shipping?.courier} - {orderData.shipping?.service}</p>
          </div>
        </div>

        {/* RINGKASAN PRODUK */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h3 className="text-xs font-extrabold uppercase text-gray-900 tracking-wider">
            Produk Dipesan ({orderData.items ? orderData.items.length : 0})
          </h3>
          
          {orderData.items && orderData.items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-[#F3F4F6] rounded-lg p-2 flex items-center justify-center shrink-0">
                  <img src={item.image_url || '/assets/images/product-placeholder.jpg'} alt={item.product_name} className="w-full h-full object-contain" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">{item.product_name}</h4>
                  <p className="text-[11px] text-gray-500">
                    {item.color_name || ''} {item.size ? `/ ${item.size}` : ''} x{item.quantity}
                  </p>
                </div>
              </div>
              <p className="text-xs font-bold text-gray-900">
                Rp {Number(item.price * item.quantity).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
              </p>
            </div>
          ))}

          <div className="flex justify-between items-center pt-2">
            <span className="text-xs font-bold text-gray-700">Total Pembayaran (Termasuk Ongkir)</span>
            <span className="text-sm font-extrabold text-[#E5231B]">
              Rp {Number(orderData.total_amount).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>

      </main>

      {/* 3. FOOTER */}
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

export default OrderTrackingPage;