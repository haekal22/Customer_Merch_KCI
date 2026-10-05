import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AuthPage from '../pages/AuthPage';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/login" element={<AuthPage />} />
      {/* Rute Halaman Lainnya akan Ditambahkan Selanjutnya */}
    </Routes>
  );
};

export default AppRoutes;