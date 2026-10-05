import React, { useState } from 'react';
import axios from 'axios';

const AuthPage = () => {
  // State Tab Aktif: 'login' atau 'register'
  const [activeTab, setActiveTab] = useState('login');

  // State Form Login
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  // State Form Register
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  // State Feedback & Loading
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Handle Input Login
  const handleLoginChange = (e) => {
    const { name, value, type, checked } = e.target;
    setLoginData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle Input Register
  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Submit Login
  const handleLoginSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!loginData.email || !loginData.password) {
      setErrorMessage('Alamat email dan kata sandi wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5001/api/customer/auth/login', {
        email: loginData.email,
        password: loginData.password
      });

      if (response.data.token) {
        localStorage.setItem('customer_token', response.data.token);
        localStorage.setItem('customer_user', JSON.stringify(response.data.user));
        setSuccessMessage('Login berhasil! Mengalihkan...');
        
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Gagal masuk. Periksa kembali email & kata sandi Anda.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Register
  const handleRegisterSubmit = async (e) => {
    // Mencegah browser reload/refresh halaman
    if (e && e.preventDefault) e.preventDefault();
    
    setErrorMessage('');
    setSuccessMessage('');

    // Baca status centang langsung dari elemen DOM agar 100% presisi
    const agreeCheckbox = document.getElementById('agreeTerms');
    const isChecked = agreeCheckbox ? agreeCheckbox.checked : false;

    if (!isChecked) {
      setErrorMessage('Anda harus menyetujui Syarat & Ketentuan dan Kebijakan Privasi.');
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok dengan kata sandi.');
      return;
    }

    setLoading(true);
    try {
      await axios.post('http://localhost:5001/api/customer/auth/register', {
        name: registerData.name,
        email: registerData.email,
        phone: registerData.phone,
        password: registerData.password
      });

      setSuccessMessage('Pendaftaran akun berhasil! Silakan masuk.');
      
      // Reset form setelah berhasil
      setRegisterData({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
      });
      if (agreeCheckbox) agreeCheckbox.checked = false;

      setTimeout(() => {
        setActiveTab('login');
        setSuccessMessage('');
      }, 1500);

    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Pendaftaran akun gagal. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between font-sans text-gray-800">
      {/* Header Navigation */}
      <header className="w-full border-b border-gray-200 py-4 px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src="/assets/images/logo-cmerch.svg" 
              alt="C-Merch Logo" 
              className="h-8 object-contain shrink-0"
            />
          </div>
        </div>
      </header>

      {/* Main Form Box */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-[500px] bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
          {/* Logo Box */}
          <div className="flex justify-center mb-6">
            <img 
              src="/assets/images/logo-cmerch.svg" 
              alt="C-Merch Logo" 
              className="h-10 object-contain shrink-0"
            />
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              type="button"
              onClick={() => { setActiveTab('login'); setErrorMessage(''); setSuccessMessage(''); }}
              className={`flex-1 py-3 text-center font-bold text-sm transition-colors relative cursor-pointer ${
                activeTab === 'login' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Masuk
              {activeTab === 'login' && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-red-600 rounded-full" />
              )}
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('register'); setErrorMessage(''); setSuccessMessage(''); }}
              className={`flex-1 py-3 text-center font-bold text-sm transition-colors relative cursor-pointer ${
                activeTab === 'register' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Daftar Akun
              {activeTab === 'register' && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-red-600 rounded-full" />
              )}
            </button>
          </div>

          {/* Alert Status */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl font-medium">
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-xs rounded-xl font-medium">
              {successMessage}
            </div>
          )}

          {/* TAB 1: LOGIN */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Alamat Email</label>
                <input
                  type="email"
                  name="email"
                  value={loginData.email}
                  onChange={handleLoginChange}
                  placeholder="Nama@gmail.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-red-600 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Kata Sandi</label>
                <input
                  type="password"
                  name="password"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  placeholder="Masukan Kata Sandi"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-red-600 transition"
                  required
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-gray-600 font-medium">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={loginData.rememberMe}
                    onChange={handleLoginChange}
                    className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                  />
                  Ingat Saya
                </label>
                <a href="#forgot" className="font-bold text-gray-900 hover:underline">
                  Lupa Kata Sandi?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl transition duration-200 text-sm mt-4 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Memproses...' : 'Masuk'}
              </button>
            </form>
          )}

          {/* TAB 2: REGISTER */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  name="name"
                  value={registerData.name}
                  onChange={handleRegisterChange}
                  placeholder="Nama Sesuai Identitas"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-red-600 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Alamat Email</label>
                <input
                  type="email"
                  name="email"
                  value={registerData.email}
                  onChange={handleRegisterChange}
                  placeholder="Nama@gmail.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-red-600 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nomor Handphone</label>
                <input
                  type="tel"
                  name="phone"
                  value={registerData.phone}
                  onChange={handleRegisterChange}
                  placeholder="08xx-xxxx-xxxx"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-red-600 transition"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Kata Sandi</label>
                  <input
                    type="password"
                    name="password"
                    value={registerData.password}
                    onChange={handleRegisterChange}
                    placeholder="Min. 8 Karakter"
                    className="w-full px-3 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-red-600 transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Konfirmasi Sandi</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={registerData.confirmPassword}
                    onChange={handleRegisterChange}
                    placeholder="Ulangi Kata Sandi"
                    className="w-full px-3 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-red-600 transition"
                    required
                  />
                </div>
              </div>

              {/* Checkbox Syarat & Ketentuan */}
              <div className="flex items-start gap-2 text-[11px] pt-1">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  name="agreeTerms"
                  className="w-4 h-4 mt-0.5 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer shrink-0"
                />
                <label htmlFor="agreeTerms" className="text-gray-600 leading-tight cursor-pointer">
                  Saya Menyetujui{' '}
                  <span className="font-bold text-gray-900">Syarat & Ketentuan</span> dan{' '}
                  <span className="font-bold text-gray-900">Kebijakan Privasi</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl transition duration-200 text-sm mt-4 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Memproses...' : 'Buat Akun'}
              </button>
            </form>
          )}
        </div>

        {/* Footer Link Text */}
        <div className="mt-6 text-center text-xs text-gray-500 max-w-[480px]">
          {activeTab === 'login' ? (
            <p>
              Belum punya akun?{' '}
              <button
                type="button"
                onClick={() => { setActiveTab('register'); setErrorMessage(''); setSuccessMessage(''); }}
                className="font-bold text-gray-900 hover:underline cursor-pointer"
              >
                Daftar Sekarang
              </button>{' '}
              untuk menikmati checkout lebih cepat & lacak pesanan dengan mudah.
            </p>
          ) : (
            <p>
              Sudah punya akun?{' '}
              <button
                type="button"
                onClick={() => { setActiveTab('login'); setErrorMessage(''); setSuccessMessage(''); }}
                className="font-bold text-gray-900 hover:underline cursor-pointer"
              >
                Masuk di sini.
              </button>
            </p>
          )}
        </div>
      </main>

      {/* Footer Page */}
      <footer className="w-full border-t border-gray-200 py-4 px-8 text-xs text-gray-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© 2026 C-Merch Official Store. Seluruh hak cipta dilindungi.</p>
          <div className="flex gap-6 font-bold text-gray-800">
            <a href="#terms" className="hover:underline">Syarat & Ketentuan</a>
            <a href="#privacy" className="hover:underline">Kebijakan Privasi</a>
            <a href="#contact" className="hover:underline">Hubungi Kami</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AuthPage;