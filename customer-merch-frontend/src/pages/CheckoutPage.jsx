import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Search, 
  User, 
  Heart, 
  ShoppingBag, 
  ChevronDown, 
  ChevronLeft,
  Lock,
  Loader2,
  QrCode
} from 'lucide-react';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  // State Data Checkout & Keranjang
  const [cartItems, setCartItems] = useState([]);
  const [shippingAddress, setShippingAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Daftar Kurir Utama Komerce
  const availableCouriers = [
    { id: 'jne', name: 'JNE', description: 'Jaringan pengiriman terluas di Indonesia' },
    { id: 'sicepat', name: 'SiCepat', description: 'Pengiriman cepat dengan jangkauan luas' },
    { id: 'jnt', name: 'J&T Express', description: 'Pengiriman harian ke seluruh Indonesia' },
    { id: 'anteraja', name: 'AnterAja', description: 'Pengiriman fleksibel dengan opsi sameday' }
  ];

  // State Pilihan Kurir & Layanan Dinamis Komerce API
  const [selectedCourierId, setSelectedCourierId] = useState('jne');
  const [dynamicServices, setDynamicServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [loadingOngkir, setLoadingOngkir] = useState(false);

  // Helper Header JWT Token
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

  // 1. FETCH DATA CHECKOUT AWAL
  useEffect(() => {
    const fetchCheckoutInfo = async () => {
      try {
        setLoading(true);
        const res = await axios.get('http://localhost:5001/api/customer/checkout/info', {
          headers: getAuthHeader()
        });

        const items = res.data.cart_items || [];
        setCartItems(items);

        if (res.data.address) {
          setShippingAddress({
            id: res.data.address.id,
            recipient_name: res.data.address.recipient_name,
            phone: res.data.address.phone_number || res.data.address.phone,
            address_text: `${res.data.address.full_address || ''}, ${res.data.address.district || ''}, ${res.data.address.city || ''}`,
            city_id: res.data.address.city_id || res.data.address.destination_id || 17601,
            email: res.data.address.email || 'customer@cmerch.id'
          });
        }
      } catch (error) {
        console.error('Gagal mengambil data checkout dari DB:', error);
        if (error.response && error.response.status === 401) {
          alert('Silakan login terlebih dahulu untuk melakukan checkout.');
          navigate('/auth');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCheckoutInfo();
  }, [navigate]);

  // 2. FETCH ONGKIR DINAMIS VIA KOMERCE API
  const fetchShippingCosts = async (courierCode, cityId) => {
    try {
      setLoadingOngkir(true);
      const totalWeight = cartItems.reduce((sum, item) => sum + (item.quantity * 300), 300);

      const res = await axios.post('http://localhost:5001/api/customer/checkout/shipping-cost', {
        destination_city_id: cityId || 17601,
        weight_grams: totalWeight,
        courier: courierCode
      }, {
        headers: getAuthHeader()
      });

      const services = res.data.services || [];
      setDynamicServices(services);

      if (services.length > 0) {
        setSelectedServiceId(services[0].id);
      } else {
        setSelectedServiceId('');
      }

    } catch (error) {
      console.error('Gagal menghitung tarif ongkir Komerce API:', error);
    } finally {
      setLoadingOngkir(false);
    }
  };

  useEffect(() => {
    if (cartItems.length > 0 && shippingAddress) {
      fetchShippingCosts(selectedCourierId, shippingAddress.city_id);
    }
  }, [selectedCourierId, cartItems, shippingAddress]);

  const currentService = dynamicServices.find(s => s.id === selectedServiceId) || dynamicServices[0];

  const subtotalItems = cartItems.reduce((sum, item) => sum + Number(item.subtotal || (item.price * item.quantity)), 0);
  const shippingFee = currentService ? Number(currentService.price) : 0;
  const grandTotal = subtotalItems + shippingFee;

  const handleSelectCourier = (courierId) => {
    setSelectedCourierId(courierId);
  };

  // 3. FUNGSI PLACE ORDER & NAVIGASI KE HALAMAN PAYMENT (/payment)
  const handleCreateOrder = async () => {
    if (cartItems.length === 0) {
      alert('Keranjang belanja kosong.');
      return;
    }

    try {
      setIsSubmitting(true);

      const activeCourier = availableCouriers.find(c => c.id === selectedCourierId);

      const payload = {
        address_id: shippingAddress?.id || null,
        shipping_courier: activeCourier?.name || selectedCourierId.toUpperCase(),
        shipping_service: currentService?.service_code || 'REG',
        shipping_cost: shippingFee,
        payment_method: 'QRIS'
      };

      const res = await axios.post('http://localhost:5001/api/customer/checkout/create-order', payload, {
        headers: getAuthHeader()
      });

      const orderData = res.data.order;

      // REDIRECT LANGSUNG KE HALAMAN PAYMENT
      navigate(`/payment?order_id=${orderData.id}`);

    } catch (error) {
      console.error('Gagal membuat pesanan:', error);
      alert('Gagal memproses pesanan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-gray-500 gap-2 font-sans">
        <Loader2 className="animate-spin text-red-600" size={28} />
        <span className="text-sm font-semibold">Memuat Data Checkout...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800 flex flex-col w-full">
      
      {/* HEADER NAVIGATION */}
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
              {cartItems.length > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {cartItems.length}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* AREA CHECKOUT & SUMMARY */}
      <div className="pt-[105px] md:pt-[115px] flex-1 grid grid-cols-1 md:grid-cols-12 w-full">
        
        {/* SISI KIRI: FORM CHECKOUT */}
        <main className="md:col-span-7 px-8 md:px-12 lg:px-16 py-8 border-r border-gray-200 space-y-8">
          
          <Link to="/cart" className="inline-flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-red-600">
            <ChevronLeft size={16} /> Kembali ke Keranjang
          </Link>

          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Checkout</h1>
            <p className="text-xs text-gray-500 mt-1">Data Pengirimanmu sudah tersimpan. Tinjau lalu pilih pengiriman & Pembayaran</p>
          </div>

          {/* SECTION ALAMAT PENGIRIMAN */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-gray-900">DIKIRIM KE</h2>
              <Link to="/account" className="text-xs font-bold text-gray-800 hover:underline cursor-pointer">
                Ubah Alamat
              </Link>
            </div>

            <div className="bg-[#F9FAFB] p-5 rounded-2xl border border-gray-100 space-y-1.5">
              <p className="text-sm font-bold text-gray-900">
                {shippingAddress?.recipient_name || 'Pelanggan C-Merch'} 
                <span className="text-xs font-normal text-gray-500 ml-2">{shippingAddress?.phone}</span>
              </p>
              <p className="text-xs text-gray-500 leading-relaxed">
                {shippingAddress?.address_text}
              </p>
              <p className="text-xs text-gray-500">{shippingAddress?.email}</p>
            </div>
          </div>

          {/* SECTION METODE PENGIRIMAN DINAMIS */}
          <div>
            <h2 className="text-sm font-bold text-gray-900 mb-1">Metode Pengiriman</h2>
            <p className="text-xs font-bold text-gray-400 mb-4">Pilih Jasa Pengiriman (Dinamis Real-Time)</p>

            <div className="space-y-3">
              {availableCouriers.map((courier) => {
                const isSelected = selectedCourierId === courier.id;

                return (
                  <div key={courier.id} className="flex flex-col gap-3">
                    <div 
                      onClick={() => handleSelectCourier(courier.id)}
                      className={`p-4 rounded-2xl border transition cursor-pointer flex items-center gap-4 ${
                        isSelected ? 'border-[#E5231B] bg-white shadow-xs' : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
                        isSelected ? 'border-[#E5231B]' : 'border-gray-300'
                      }`}>
                        {isSelected && <div className="w-3.5 h-3.5 bg-[#E5231B] rounded-full" />}
                      </div>

                      <div className="flex-1 flex items-center gap-3">
                        <span className="font-extrabold text-sm text-[#E5231B] italic tracking-tight">{courier.name}</span>
                        <div>
                          <h3 className="text-sm font-extrabold text-gray-900">{courier.name}</h3>
                          <p className="text-xs text-gray-500">{courier.description}</p>
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="bg-[#F2F3F5] p-5 rounded-2xl space-y-3 mt-1">
                        <p className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                          Pilih Layanan {courier.name}
                          {loadingOngkir && <Loader2 size={12} className="animate-spin text-red-600" />}
                        </p>

                        {loadingOngkir ? (
                          <div className="text-xs text-gray-500 py-4 text-center font-medium">
                            Menghitung tarif ongkir real-time...
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {dynamicServices.map((svc) => {
                              const isSvcSelected = selectedServiceId === svc.id;

                              return (
                                <div
                                  key={svc.id}
                                  onClick={() => setSelectedServiceId(svc.id)}
                                  className={`p-4 rounded-xl border bg-white flex justify-between items-center cursor-pointer transition ${
                                    isSvcSelected 
                                      ? 'border-[#E5231B] ring-1 ring-[#E5231B]/20' 
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  <div className="flex items-center gap-3.5">
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
                                      isSvcSelected ? 'border-[#E5231B]' : 'border-gray-300'
                                    }`}>
                                      {isSvcSelected && <div className="w-3.5 h-3.5 bg-[#E5231B] rounded-full" />}
                                    </div>

                                    <div>
                                      <h4 className="text-xs font-extrabold text-gray-900">{svc.name}</h4>
                                      <p className="text-[11px] text-gray-500 mt-0.5">{svc.estimation}</p>
                                    </div>
                                  </div>

                                  <span className="text-xs font-black text-gray-900">
                                    {formatRupiah(svc.price)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION METODE PEMBAYARAN */}
          <div>
            <h2 className="text-sm font-bold text-gray-900 mb-3">Metode Pembayaran</h2>

            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center gap-4">
              <div className="bg-white p-2.5 rounded-xl shrink-0 font-extrabold text-xs tracking-wider border border-gray-200 text-emerald-700 flex items-center gap-2">
                <QrCode size={18} />
                QRIS
              </div>
              <div className="text-xs text-emerald-950 font-medium leading-relaxed">
                <span className="font-bold block text-emerald-900">QRIS — Quick Response Code Indonesian Standard</span>
                Bisa dibayar menggunakan GoPay, OVO, DANA, ShopeePay, atau aplikasi M-Banking.
              </div>
            </div>

            <p className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-3">
              <Lock size={12} className="text-gray-400" /> Transaksi aman dan dapat disimulasikan secara langsung.
            </p>
          </div>

          {/* Tombol Buat Pesanan */}
          <button 
            onClick={handleCreateOrder}
            disabled={isSubmitting || cartItems.length === 0}
            className="w-full bg-[#E5231B] hover:bg-red-700 text-white font-extrabold text-sm py-4 rounded-xl transition shadow-md cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Memproses Pesanan...</span>
              </>
            ) : (
              <span>Buat Pesanan & Bayar</span>
            )}
          </button>

        </main>

        {/* SISI KANAN: RINGKASAN BELANJA */}
        <aside className="md:col-span-5 bg-[#F9FAFB] p-8 md:p-12 flex flex-col justify-between">
          <div className="space-y-6">
            
            <div className="space-y-4 pb-6 border-b border-gray-200 max-h-[360px] overflow-y-auto">
              {cartItems.map((item) => (
                <div key={item.cart_id || item.product_id} className="flex gap-4 items-center">
                  <div className="w-16 h-16 bg-white rounded-xl p-2 border border-gray-200 shrink-0 flex items-center justify-center">
                    <img 
                      src={item.product_image || '/assets/images/product-placeholder.jpg'} 
                      alt={item.product_name} 
                      className="w-full h-full object-contain" 
                    />
                  </div>
                  <div className="flex-1 flex justify-between items-start">
                    <div>
                      <h3 className="text-xs font-bold text-gray-900">{item.product_name}</h3>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {item.color_name ? `${item.color_name} ` : ''}{item.size ? `(${item.size})` : ''} x{item.quantity}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-gray-900">
                      {formatRupiah(item.subtotal || (item.price * item.quantity))}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3.5 text-xs text-gray-700 pb-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <span>Subtotal Barang</span>
                <span className="font-semibold text-gray-900">{formatRupiah(subtotalItems)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Pengiriman ({selectedCourierId.toUpperCase()} - {currentService?.name || 'Reguler'})</span>
                <span className="font-semibold text-gray-900">
                  {loadingOngkir ? 'Menghitung...' : formatRupiah(shippingFee)}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center text-sm font-extrabold text-gray-900">
              <span className="text-base">Total</span>
              <span className="text-lg font-black">{formatRupiah(grandTotal)}</span>
            </div>

          </div>
        </aside>

      </div>

    </div>
  );
};

export default CheckoutPage;