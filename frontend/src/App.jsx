import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';

// Layout
import Layout from './components/Layout';
import PrivateRoute from './components/Layout/PrivateRoute';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

import DanhSachNV from './pages/nhanvien/DanhSachNV';
import LichDangKy from './pages/dangkyca/LichDangKy';
import DuyetDangKy from './pages/dangkyca/DuyetDangKy';

import ChamCongCa from './pages/chamcong/ChamCongCa';
import BangLuong from './pages/luong/BangLuong';
import ThuongPhat from './pages/luong/ThuongPhat';
import CauHinhLuong from './pages/luong/CauHinhLuong';
import ThongKeChiPhi from './pages/thongke/ThongKeChiPhi';

import ThongBao from './pages/thongbao/ThongBao';
import Profile from './pages/nhanvien/Profile';

// Dummy Pages cho Cấu trúc
const PlaceholderPage = ({ title }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 min-h-[400px] flex items-center justify-center">
        <h2 className="text-xl text-gray-400">{title} - Đang phát triển</h2>
    </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              {/* Tất cả mọi người */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/thong-bao" element={<ThongBao />} />
              <Route path="/ho-so/:id" element={<Profile />} />
              <Route path="/ho-so" element={<Profile />} />
              
              {/* Nhân viên */}
              <Route path="/dang-ky-ca" element={<PrivateRoute allowedRoles={['NV']}><LichDangKy /></PrivateRoute>} />
              
              {/* Quản lý ca + Chủ */}
              <Route path="/duyet-ca" element={<PrivateRoute allowedRoles={['QLC', 'CST']}><DuyetDangKy /></PrivateRoute>} />

              <Route path="/cham-cong" element={<PrivateRoute allowedRoles={['QLC', 'CST']}><ChamCongCa /></PrivateRoute>} />
              
              {/* Chủ siêu thị */}
              <Route path="/nhan-vien" element={<PrivateRoute allowedRoles={['CST']}><DanhSachNV /></PrivateRoute>} />
              <Route path="/bang-luong" element={<PrivateRoute allowedRoles={['CST']}><BangLuong /></PrivateRoute>} />
              <Route path="/thuong-phat" element={<PrivateRoute allowedRoles={['CST']}><ThuongPhat /></PrivateRoute>} />
              <Route path="/cau-hinh-luong" element={<PrivateRoute allowedRoles={['CST']}><CauHinhLuong /></PrivateRoute>} />
              <Route path="/thong-ke" element={<PrivateRoute allowedRoles={['CST']}><ThongKeChiPhi /></PrivateRoute>} />
            </Route>
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
