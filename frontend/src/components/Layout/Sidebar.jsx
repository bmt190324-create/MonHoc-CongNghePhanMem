import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
    HomeIcon, 
    CalendarIcon, 
    UsersIcon, 
    CurrencyDollarIcon, 
    ChartBarIcon, 
    ClipboardDocumentCheckIcon,
    Cog6ToothIcon,
    MegaphoneIcon,
    UserCircleIcon
} from '@heroicons/react/24/outline';

const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const { user } = useAuth();
  
  if (!user) return null;

  const role = user.vaiTro;

  const menus = [
    // All
    { name: 'Trang chủ', path: '/', icon: HomeIcon, roles: ['NV', 'QLC', 'CST'] },
    { name: 'Bảng Thông báo', path: '/thong-bao', icon: MegaphoneIcon, roles: ['NV', 'QLC', 'CST'] },

    // NV
    { name: 'Đăng ký ca', path: '/dang-ky-ca', icon: CalendarIcon, roles: ['NV'] },
    
    // QLC
    { name: 'Duyệt ca', path: '/duyet-ca', icon: ClipboardDocumentCheckIcon, roles: ['QLC', 'CST'] },
    { name: 'Chấm công', path: '/cham-cong', icon: UsersIcon, roles: ['QLC', 'CST'] },

    // CST
    { name: 'Nhân viên', path: '/nhan-vien', icon: UsersIcon, roles: ['CST'] },
    { name: 'Bảng lương', path: '/bang-luong', icon: CurrencyDollarIcon, roles: ['CST'] },
    { name: 'Thưởng / Phạt', path: '/thuong-phat', icon: CurrencyDollarIcon, roles: ['CST'] },
    { name: 'Cấu hình lương', path: '/cau-hinh-luong', icon: Cog6ToothIcon, roles: ['CST'] },
    { name: 'Thống kê', path: '/thong-ke', icon: ChartBarIcon, roles: ['CST'] },
    { name: 'Cá nhân', path: '/ho-so', icon: UserCircleIcon, roles: ['NV', 'QLC', 'CST'] },
  ];

  const filteredMenus = menus.filter(m => m.roles.includes(role));

  const navClass = ({ isActive }) => 
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        isActive 
            ? 'bg-primary-50 text-primary-600 font-medium' 
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`;

  return (
    <>
        {/* Mobile overlay */}
        {mobileOpen && (
            <div 
                className="fixed inset-0 bg-black/50 z-20 md:hidden"
                onClick={() => setMobileOpen(false)}
            />
        )}
        
        {/* Sidebar */}
        <aside className={`fixed top-0 left-0 h-screen w-64 bg-white border-r border-gray-200 z-30 transition-transform duration-300 md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="h-16 flex items-center px-6 border-b border-gray-200">
                <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-blue-400 bg-clip-text text-transparent">
                    MiniMart HR
                </span>
            </div>
            
            <div className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
                {filteredMenus.map(menu => (
                    <NavLink 
                        key={menu.path} 
                        to={menu.path} 
                        className={navClass}
                        onClick={() => setMobileOpen(false)}
                    >
                        <menu.icon className="w-5 h-5" />
                        {menu.name}
                    </NavLink>
                ))}
            </div>
        </aside>
    </>
  );
};

export default Sidebar;
