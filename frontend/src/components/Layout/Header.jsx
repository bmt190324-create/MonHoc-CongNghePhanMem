import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Bars3Icon, ArrowRightOnRectangleIcon, BellIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const Header = ({ setMobileOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Đã đăng xuất');
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
            <button 
                onClick={() => setMobileOpen(prev => !prev)}
                className="p-2 -ml-2 rounded-lg hover:bg-gray-100 md:hidden"
            >
                <Bars3Icon className="w-6 h-6 text-gray-600" />
            </button>
            <h2 className="text-xl font-semibold text-gray-800 md:hidden">MiniMart</h2>
        </div>

        <div className="flex items-center gap-4 ml-auto">
            <button 
                onClick={() => navigate('/thong-bao')}
                className="relative p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                title="Thông báo"
            >
                <BellIcon className="w-6 h-6" />
            </button>

            <button 
                onClick={() => navigate('/ho-so')}
                className="flex items-center gap-3 hover:bg-gray-50 p-1 px-2 rounded-xl transition-colors text-left group"
                title="Xem trang cá nhân"
            >
                <div className="hidden sm:block text-right">
                    <p className="text-sm font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{user?.hoTen}</p>
                    <p className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-bold inline-block">{user?.vaiTro}</p>
                </div>
                
                <div className="h-10 w-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold border border-primary-200 shadow-sm group-hover:scale-105 transition-transform">
                    {user?.hoTen?.charAt(0)?.toUpperCase()}
                </div>
            </button>

            <button 
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-2"
                title="Đăng xuất"
            >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
            </button>
        </div>
    </header>
  );
};

export default Header;
