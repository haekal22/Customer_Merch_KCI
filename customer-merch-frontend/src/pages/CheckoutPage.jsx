import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  User, 
  Heart, 
  ShoppingBag, 
  ChevronDown, 
  ChevronLeft,
  Lock
} from 'lucide-react';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  // Data Barang di Checkout
  const cartItem = {
    name: 'T-Shirt Anak',
    variant: 'Train Brothers (Sky Blue)',
    price: 100000,
    image: '/assets/images/product-placeholder.jpg'
  };

  // Data Kurir & Layanan
  const couriers = [
    {
      id: 'jne',
      name: 'JNE',
      description: 'Jaringan pengiriman terluas di Indonesia',
      services: [
        { id: 'jne_reg', name: 'JNE Reguler', estimation: 'Estimasi Tiba 2 - 3 hari kerja', price: 12000 },
        { id: 'jne_exp', name: 'JNE Express', estimation: 'Estimasi tiba 1 hari kerja', price: 28000 }
      ]
    },
    {
      id: 'sicepat',
      name: 'SiCepat',
      description: 'Pengiriman cepat dengan jangkauan luas',
      services: [
        { id: 'sicepat_reg', name: 'SiCepat Reguler', estimation: 'Estimasi Tiba 2 - 4 hari kerja', price: 11000 },
        { id: 'sicepat_exp', name: 'SiCepat Express', estimation: 'Estimasi tiba 1 hari kerja', price: 25000 }
      ]
    },
    {
      id: 'jnt',
      name: 'J&T',
      description: 'Pengiriman harian ke seluruh Indonesia',
      services: [
        { id: 'jnt_reg', name: 'J&T Reguler', estimation: 'Estimasi Tiba 2 - 3 hari kerja', price: 13000 },
        { id: 'jnt_exp', name: 'J&T Express', estimation: 'Estimasi tiba 1 hari kerja', price: 26000 }
      ]
    },
    {
      id: 'anteraja',
      name: 'AnterAja',
      description: 'Pengiriman fleksibel dengan opsi sameday',
      services: [
        { id: 'anteraja_reg', name: 'AnterAja Reguler', estimation: 'Estimasi Tiba 2 - 4 hari kerja', price: 11000 },
        { id: 'anteraja_exp', name: 'AnterAja Express', estimation: 'Estimasi tiba 1 hari kerja', price: 25000 }
      ]
    }
  ];

  // State Kurir & Layanan Terpilih (Default JNE Reguler)
  const [selectedCourierId, setSelectedCourierId] = useState('jne');
  const [selectedServiceId, setSelectedServiceId] = useState('jne_reg');

  // Cari Objek Kurir & Layanan Aktif
  const currentCourier = couriers.find(c => c.id === selectedCourierId);
  const currentService = currentCourier?.services.find(s => s.id === selectedServiceId) || currentCourier?.services[0];

  // Hitung Total
  const shippingFee = currentService ? currentService.price : 0;
  const grandTotal = cartItem.price + shippingFee;

  // Format Rupiah
  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(number || 0).replace('IDR', 'Rp');
  };

  // Trigger Pilih Kurir
  const handleSelectCourier = (courierId) => {
    setSelectedCourierId(courierId);
    const courier = couriers.find(c => c.id === courierId);
    if (courier && courier.services.length > 0) {
      setSelectedServiceId(courier.services[0].id);
    }
  };

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
            <a href="/auth" className="hover:text-red-600"><User size={26} /></a>
            <a href="#wishlist" className="hover:text-red-600 relative"><Heart size={26} /></a>
            <Link to="/cart" className="hover:text-red-600 relative">
              <ShoppingBag size={26} />
              <span className="absolute -top-1.5 -right-2 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">1</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. AREA CHECKOUT & SUMMARY (GRID 60:40) */}
      <div className="pt-[105px] md:pt-[115px] flex-1 grid grid-cols-1 md:grid-cols-12 w-full">
        
        {/* SISI KIRI: FORM CHECKOUT (60% -> col-span-7) */}
        <main className="md:col-span-7 px-8 md:px-12 lg:px-16 py-8 border-r border-gray-200 space-y-8">
          
          {/* Back Button */}
          <Link to="/cart" className="inline-flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-red-600">
            <ChevronLeft size={16} /> Kembali ke Keranjang
          </Link>

          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Checkout</h1>
            <p className="text-xs text-gray-500 mt-1">Data Pengirimanmu sudah tersimpan. Tinjau lalu pilih pengiriman & Pembayaran</p>
          </div>

          {/* SECTION ALAMAT */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-gray-900">DIKIRIM KE</h2>
              <button className="text-xs font-bold text-gray-800 hover:underline cursor-pointer">Ubah Alamat</button>
            </div>

            <div className="bg-[#F9FAFB] p-5 rounded-2xl border border-gray-100 space-y-1.5">
              <p className="text-sm font-bold text-gray-900">
                Raka Pratama <span className="text-xs font-normal text-gray-500 ml-2">0812 - xxxx - xxxx</span>
              </p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Jl. Melati No. 12, RT 03/RW 05, Kecamatan Cempaka Putih, Jakarta Pusat, DKI jakarta, 15020
              </p>
              <p className="text-xs text-gray-500">Rakapratama14@gmail.com</p>
            </div>
          </div>

          {/* SECTION METODE PENGIRIMAN (PERBAIKAN SESUAI FOTO 2) */}
          <div>
            <h2 className="text-sm font-bold text-gray-900 mb-1">Metode Pengiriman</h2>
            <p className="text-xs font-bold text-gray-400 mb-4">Pilih Jasa Pengiriman</p>

            <div className="space-y-3">
              {couriers.map((courier) => {
                const isSelected = selectedCourierId === courier.id;

                return (
                  <div key={courier.id} className="flex flex-col gap-3">
                    
                    {/* Card Jasa Kurir Utama */}
                    <div 
                      onClick={() => handleSelectCourier(courier.id)}
                      className={`p-4 rounded-2xl border transition cursor-pointer flex items-center gap-4 ${
                        isSelected ? 'border-[#E5231B] bg-white shadow-xs' : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      {/* Custom Red Radio Button */}
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
                        isSelected ? 'border-[#E5231B]' : 'border-gray-300'
                      }`}>
                        {isSelected && <div className="w-3.5 h-3.5 bg-[#E5231B] rounded-full" />}
                      </div>

                      {/* Info Kurir */}
                      <div className="flex-1 flex items-center gap-3">
                        <span className="font-extrabold text-sm text-[#E5231B] italic tracking-tight">{courier.name}</span>
                        <div>
                          <h3 className="text-sm font-extrabold text-gray-900">{courier.name}</h3>
                          <p className="text-xs text-gray-500">{courier.description}</p>
                        </div>
                      </div>
                    </div>

                    {/* Container Opsi Layanan (PERSIS FOTO 2) */}
                    {isSelected && (
                      <div className="bg-[#F2F3F5] p-5 rounded-2xl space-y-3 mt-1">
                        <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                          Pilih Layanan {courier.name}
                        </p>

                        <div className="space-y-3">
                          {courier.services.map((svc) => {
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
                                {/* Radio + Nama Layanan */}
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

                                {/* Harga Layanan */}
                                <span className="text-xs font-black text-gray-900">
                                  {formatRupiah(svc.price)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
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

            {/* QRIS Box */}
            <div className="bg-[#A7F3D0] border border-emerald-300 p-4 rounded-2xl flex items-center gap-4">
              <div className="bg-white px-3 py-2 rounded-lg shrink-0 font-extrabold text-xs tracking-wider border border-gray-200">
                QRIS
              </div>
              <div className="text-xs text-emerald-950 font-medium leading-relaxed">
                <span className="font-bold block text-emerald-900">QRIS</span>
                Bisa dibayar pakai GoPay, OVO, DANA, ShopeePay, atau m-Banking apa pun yang mendukung QRIS.
              </div>
            </div>

            <p className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-3">
              <Lock size={12} className="text-gray-400" /> Semua transaksi diproses dengan enkripsi aman.
            </p>
          </div>

          {/* Tombol Buat Pesanan */}
          <button 
            onClick={() => alert("Pesanan Berhasil Dibuat!")}
            className="w-full bg-[#E5231B] hover:bg-red-700 text-white font-extrabold text-sm py-4 rounded-xl transition shadow-md cursor-pointer uppercase tracking-wider"
          >
            Buat Pesanan
          </button>

          {/* Footer Sub Links */}
          <div className="pt-6 border-t border-gray-200 flex gap-6 text-xs text-gray-500 font-semibold">
            <a href="#syarat" className="hover:underline">Syarat & ketentuan</a>
            <a href="#privasi" className="hover:underline">Kebijakan Privasi</a>
            <a href="#hubungi" className="hover:underline">Hubungi Kami</a>
          </div>

        </main>

        {/* SISI KANAN: RINGKASAN BELANJA (40% -> col-span-5) */}
        <aside className="md:col-span-5 bg-[#F9FAFB] p-8 md:p-12 flex flex-col justify-between">
          <div className="space-y-6">
            
            {/* Ringkasan Item Produk */}
            <div className="flex gap-4 items-center pb-6 border-b border-gray-200">
              <div className="w-20 h-20 bg-white rounded-xl p-2 border border-gray-200 shrink-0 flex items-center justify-center">
                <img src={cartItem.image} alt={cartItem.name} className="w-full h-full object-contain" />
              </div>
              <div className="flex-1 flex justify-between items-start">
                <div>
                  <h3 className="text-xs font-bold text-gray-900">{cartItem.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{cartItem.variant}</p>
                </div>
                <span className="text-xs font-bold text-gray-900">{formatRupiah(cartItem.price)}</span>
              </div>
            </div>

            {/* Rincian Subtotal & Pengiriman */}
            <div className="space-y-3.5 text-xs text-gray-700 pb-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <span>Subtotal Barang</span>
                <span className="font-semibold text-gray-900">{formatRupiah(cartItem.price)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Pengiriman ({currentCourier?.name} - {currentService?.name.includes('Reguler') ? 'Reguler' : 'Express'})</span>
                <span className="font-semibold text-gray-900">{formatRupiah(shippingFee)}</span>
              </div>
            </div>

            {/* Total Keseluruhan */}
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