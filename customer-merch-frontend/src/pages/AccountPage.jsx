import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Search, 
  User, 
  Heart, 
  ShoppingBag, 
  ChevronDown, 
  Loader2, 
  CheckCircle2, 
  MapPin 
} from 'lucide-react';

const AccountPage = () => {
  const navigate = useNavigate();
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Stats Counters
  const [stats, setStats] = useState({ orders: 0, wishlist: 0, cart: 0 });

  // State Profile & Form Alamat
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    birth_date: ''
  });

  const [address, setAddress] = useState({
    full_address: '',
    district: '',
    city: '',
    province: '',
    postal_code: '',
    destination_id: 17601
  });

  // State Autocomplete Pencarian Kecamatan / Lokasi
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Helper Header JWT
  const getAuthHeader = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('customer_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // 1. FETCH PROFILE & ALAMAT CUSTOMER
  useEffect(() => {
    const fetchProfileAndAddress = async () => {
      try {
        setLoading(true);
        // Fetch Me / Profile
        const profileRes = await axios.get('http://localhost:5001/api/customer/auth/me', {
          headers: getAuthHeader()
        });

        const user = profileRes.data.user || profileRes.data;
        setProfile({
          name: user.name || 'Muhammad Haekal',
          email: user.email || 'mhmdhaekal22@gmail.com',
          phone: user.phone || '',
          birth_date: user.birth_date || ''
        });

        // Fetch Address
        const addrRes = await axios.get('http://localhost:5001/api/customer/checkout/addresses', {
          headers: getAuthHeader()
        });

        if (addrRes.data) {
          const a = addrRes.data;
          setAddress({
            full_address: a.full_address || '',
            district: a.district || '',
            city: a.city || '',
            province: a.province || '',
            postal_code: a.postal_code || '',
            destination_id: a.destination_id || 17601
          });
          if (a.district) {
            setSearchKeyword(`${a.district}, ${a.city}`);
          }
        }

      } catch (error) {
        console.error('Gagal memuat profil/alamat:', error);
        if (error.response?.status === 401) {
          alert('Sesi telah berakhir. Silakan login kembali.');
          navigate('/auth');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndAddress();
  }, [navigate]);

  // 2. LOGIKA PENCARIAN KECAMATAN / LOKASI DINAMIS (KOMERCE API)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchKeyword.trim().length >= 3 && showDropdown) {
        try {
          setIsSearching(true);
          const res = await axios.get(
            `http://localhost:5001/api/customer/checkout/search-destination?search=${encodeURIComponent(searchKeyword)}`,
            { headers: getAuthHeader() }
          );
          setSearchResults(res.data.data || []);
        } catch (err) {
          console.error('Error searching destination:', err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchKeyword, showDropdown]);

  // Handler Pilih Lokasi dari Dropdown
  const handleSelectLocation = (loc) => {
    setAddress(prev => ({
      ...prev,
      district: loc.subdistrict_name,
      city: loc.city_name,
      province: loc.province_name,
      postal_code: loc.zip_code,
      destination_id: loc.destination_id
    }));
    setSearchKeyword(`${loc.subdistrict_name}, ${loc.city_name}`);
    setShowDropdown(false);
  };

  // 3. SIMPAN PERUBAHAN ALAMAT & PROFIL
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setSaveSuccess(false);

      const payload = {
        recipient_name: profile.name,
        phone_number: profile.phone || '085926944122',
        full_address: address.full_address,
        province: address.province,
        city: address.city,
        district: address.district,
        postal_code: address.postal_code,
        destination_id: address.destination_id,
        is_default: true
      };

      await axios.post('http://localhost:5001/api/customer/checkout/addresses', payload, {
        headers: getAuthHeader()
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

    } catch (error) {
      console.error('Gagal menyimpan alamat:', error);
      alert('Gagal menyimpan perubahan alamat.');
    } finally {
      setIsSaving(false);
    }
  };

  const isAddressComplete = Boolean(address.full_address && address.district && address.city);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-gray-500 gap-2 font-sans">
        <Loader2 className="animate-spin text-red-600" size={28} />
        <span className="text-sm font-semibold">Memuat Data Akun...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800 flex flex-col w-full">
      
      {/* 1. HEADER NAVIGATION */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 w-full shadow-xs">
        <div className="w-full px-8 md:px-12 py-5 md:py-6 flex items-center justify-between gap-10">
          <Link to="/" className="shrink-0">
            <img src="/assets/images/logo-cmerch.svg" alt="C-Merch" className="h-10 md:h-12 w-auto object-contain" />
          </Link>

          <nav className="flex items-center gap-8 font-bold text-sm md:text-base uppercase tracking-wide text-gray-800">
            <Link to="/" className="hover:text-red-600">BERANDA</Link>
            
            <div 
              className="relative py-1 cursor-pointer group"
              onMouseEnter={() => setIsCategoryOpen(true)}
              onMouseLeave={() => setIsCategoryOpen(false)}
            >
              <button className="flex items-center gap-1.5 text-gray-800 hover:text-red-600 font-bold">
                ANAK - ANAK <ChevronDown size={16} />
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

            <a href="#dewasa" className="hover:text-red-600">DEWASA</a>
            <Link to="/products" className="hover:text-red-600">SEMUA PRODUK</Link>
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
            <Link to="/account" className="text-red-600"><User size={26} /></Link>
            <Link to="/wishlist" className="hover:text-red-600 relative"><Heart size={26} /></Link>
            <Link to="/cart" className="hover:text-red-600 relative"><ShoppingBag size={26} /></Link>
          </div>
        </div>
      </header>

      {/* BREADCRUMB */}
      <div className="pt-[105px] md:pt-[115px] px-8 md:px-12 lg:px-16 py-4 text-xs text-gray-500 font-medium">
        <Link to="/" className="hover:text-red-600">Beranda</Link> / <span className="text-red-600 font-bold">Akun Saya</span>
      </div>

      {/* MAIN CONTAINER AKUN SAYA */}
      <div className="px-8 md:px-12 lg:px-16 py-6 pb-20 grid grid-cols-1 md:grid-cols-12 gap-10">
        
        {/* SISI KIRI: SIDEBAR AKUN */}
        <aside className="md:col-span-3 space-y-6">
          <div className="flex items-center gap-4 border-b border-gray-200 pb-6">
            <div className="w-12 h-12 bg-red-600 text-white font-extrabold text-xl rounded-full flex items-center justify-center shrink-0">
              {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden">
              <h3 className="font-extrabold text-gray-900 truncate">{profile.name}</h3>
              <p className="text-xs text-gray-500 truncate">{profile.email}</p>
            </div>
          </div>

          <nav className="space-y-3 font-bold text-sm">
            <div className="flex items-center gap-2 text-red-600 border-l-4 border-red-600 pl-3 py-1">
              Ringkasan Akun
            </div>
            <Link to="/orders" className="block text-gray-600 hover:text-red-600 pl-4 py-1">Pesanan Saya</Link>
            <Link to="/cart" className="block text-gray-600 hover:text-red-600 pl-4 py-1">Keranjang</Link>
            <Link to="/wishlist" className="block text-gray-600 hover:text-red-600 pl-4 py-1">Wishlist</Link>
            <hr className="my-3 border-gray-200" />
            <button 
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('customer_token');
                navigate('/auth');
              }}
              className="text-gray-600 hover:text-red-600 pl-4 py-1 w-full text-left cursor-pointer"
            >
              Keluar
            </button>
          </nav>
        </aside>

        {/* SISI KANAN: FORM RINGKASAN AKUN & ALAMAT PENGIRIMAN */}
        <main className="md:col-span-9 space-y-8">
          
          {/* THREE STATS CARDS */}
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-[#F2F3F5] p-6 rounded-xl text-center">
              <span className="block text-3xl font-black text-gray-900">{stats.orders}</span>
              <span className="text-xs font-semibold text-gray-500 mt-1 block">Pesanan</span>
            </div>
            <div className="bg-[#F2F3F5] p-6 rounded-xl text-center">
              <span className="block text-3xl font-black text-gray-900">{stats.wishlist}</span>
              <span className="text-xs font-semibold text-gray-500 mt-1 block">Wishlist</span>
            </div>
            <div className="bg-[#F2F3F5] p-6 rounded-xl text-center">
              <span className="block text-3xl font-black text-gray-900">{stats.cart}</span>
              <span className="text-xs font-semibold text-gray-500 mt-1 block">Keranjang</span>
            </div>
          </div>

          {/* BANNER LENGKAPI ALAMAT */}
          <div className="bg-[#FEF3C7] border border-[#FCD34D] p-5 rounded-2xl">
            <h4 className="font-bold text-sm text-amber-900 mb-1">Lengkapi Alamat Pengiriman</h4>
            <p className="text-xs text-amber-800 leading-relaxed">
              Sebagai member C-Merch, lengkapi nomor HP dan alamat pengirimanmu di bawah ini agar checkout jadi lebih cepat tanpa isi ulang form setiap kali belanja.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* SECTION INFORMASI AKUN */}
            <div>
              <h3 className="text-base font-extrabold text-gray-900 mb-4">Informasi Akun</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">Nama Lengkap</label>
                  <input 
                    type="text" 
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-3.5 text-sm focus:outline-none focus:border-red-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">Email</label>
                  <input 
                    type="email" 
                    value={profile.email}
                    disabled
                    className="w-full border border-gray-200 bg-gray-50 text-gray-500 rounded-xl p-3.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">Nomor Handphone</label>
                  <input 
                    type="text" 
                    placeholder="08xx-xxxx-xxxx"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-3.5 text-sm focus:outline-none focus:border-red-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">Tanggal Lahir</label>
                  <input 
                    type="text" 
                    placeholder="DD / MM / YYYY"
                    value={profile.birth_date}
                    onChange={(e) => setProfile({ ...profile, birth_date: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-3.5 text-sm focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>
            </div>

            {/* SECTION ALAMAT PENGIRIMAN */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-extrabold text-gray-900">Alamat Pengiriman</h3>
                <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${
                  isAddressComplete ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {isAddressComplete ? 'Sudah Lengkap' : 'Belum Lengkap'}
                </span>
              </div>
              <p className="text-xs text-gray-500">Alamat ini akan digunakan otomatis setiap kamu checkout.</p>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Negara/Wilayah</label>
                <select disabled className="w-full border border-gray-300 rounded-xl p-3.5 text-sm bg-gray-50">
                  <option>Indonesia</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Alamat Lengkap</label>
                <input 
                  type="text" 
                  placeholder="Nama Jalan, Nomor Rumah, RT/RW"
                  value={address.full_address}
                  onChange={(e) => setAddress({ ...address, full_address: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl p-3.5 text-sm focus:outline-none focus:border-red-600"
                />
              </div>

              {/* INPUT CARI KECAMATAN / LOKASI AUTOCOMPLETE DINAMIS */}
              <div className="relative">
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  Cari Kecamatan / Kota (Integrasi Real-Time Komerce)
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Ketik nama kecamatan (cth: Gambir, Cempaka Putih, Coblong)..."
                    value={searchKeyword}
                    onFocus={() => setShowDropdown(true)}
                    onChange={(e) => {
                      setSearchKeyword(e.target.value);
                      setShowDropdown(true);
                    }}
                    className="w-full border border-gray-300 rounded-xl p-3.5 pr-10 text-sm focus:outline-none focus:border-red-600"
                  />
                  {isSearching ? (
                    <Loader2 className="absolute right-3.5 top-3.5 animate-spin text-red-600" size={18} />
                  ) : (
                    <MapPin className="absolute right-3.5 top-3.5 text-gray-400" size={18} />
                  )}
                </div>

                {/* DROPDOWN HASIL PENCARIAN DESTINATION ID */}
                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-xl mt-1 max-h-60 overflow-y-auto z-50 divide-y divide-gray-100">
                    {searchResults.map((loc) => (
                      <div 
                        key={loc.destination_id}
                        onClick={() => handleSelectLocation(loc)}
                        className="p-3.5 hover:bg-red-50 cursor-pointer transition text-xs"
                      >
                        <p className="font-extrabold text-gray-900">{loc.label}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">Destination ID Komerce: <span className="font-bold text-red-600">{loc.destination_id}</span></p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">Kecamatan</label>
                  <input 
                    type="text" 
                    value={address.district}
                    onChange={(e) => setAddress({ ...address, district: e.target.value })}
                    placeholder="Otomatis terisi dari pencarian"
                    className="w-full border border-gray-300 rounded-xl p-3.5 text-sm focus:outline-none focus:border-red-600 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">Kota / Kabupaten</label>
                  <input 
                    type="text" 
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    placeholder="Otomatis terisi dari pencarian"
                    className="w-full border border-gray-300 rounded-xl p-3.5 text-sm focus:outline-none focus:border-red-600 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">Provinsi</label>
                  <input 
                    type="text" 
                    value={address.province}
                    onChange={(e) => setAddress({ ...address, province: e.target.value })}
                    placeholder="Otomatis terisi dari pencarian"
                    className="w-full border border-gray-300 rounded-xl p-3.5 text-sm focus:outline-none focus:border-red-600 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">Kode Pos</label>
                  <input 
                    type="text" 
                    value={address.postal_code}
                    onChange={(e) => setAddress({ ...address, postal_code: e.target.value })}
                    placeholder="10110"
                    className="w-full border border-gray-300 rounded-xl p-3.5 text-sm focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>

            </div>

            {/* BUTTON SIMPAN PERUBAHAN */}
            <div className="flex items-center gap-4">
              <button 
                type="submit"
                disabled={isSaving}
                className="bg-[#E5231B] hover:bg-red-700 text-white font-extrabold text-sm px-10 py-4 rounded-xl transition shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <span>Simpan Perubahan</span>
                )}
              </button>

              {saveSuccess && (
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs animate-fade-in">
                  <CheckCircle2 size={18} /> Alamat berhasil diperbarui!
                </div>
              )}
            </div>

          </form>

        </main>

      </div>

    </div>
  );
};

export default AccountPage;