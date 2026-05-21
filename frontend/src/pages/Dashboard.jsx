import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import axiosClient from '../api/axiosClient';
import { 
    BanknotesIcon, 
    ClockIcon, 
    CheckBadgeIcon, 
    ArrowTrendingUpIcon,
    CalendarIcon,
    ClipboardDocumentCheckIcon,
    UserGroupIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const StatCard = ({ title, value, icon: Icon, colorClass, subValue }) => (
    <div className="bg-white p-6 rounded-xl border border-gray-200 transition-all duration-200">
        <div className="flex items-center justify-between mb-4">
            <div className={`p-2.5 rounded-lg ${colorClass}`}>
                <Icon className="w-5 h-5" />
            </div>
            {subValue && (
                <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                    {subValue}
                </span>
            )}
        </div>
        <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
);

const QuickAction = ({ title, description, icon: Icon, onClick, colorClass }) => (
    <button 
        onClick={onClick}
        className="flex items-center gap-4 p-5 bg-white rounded-xl border border-gray-200 hover:border-primary-600 hover:shadow-sm transition-all duration-200 text-left w-full"
    >
        <div className={`p-2.5 rounded-lg ${colorClass} shrink-0`}>
            <Icon className="w-5 h-5" />
        </div>
        <div>
            <h4 className="font-bold text-gray-900 uppercase text-[10px] tracking-widest mb-0.5">{title}</h4>
            <p className="text-sm text-gray-500 line-clamp-1">{description}</p>
        </div>
    </button>
);

const Dashboard = () => {
    const { user } = useAuth();
    const [incomeData, setIncomeData] = useState(null);
    const [nextShift, setNextShift] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchIncome = async () => {
            try {
                const res = await axiosClient.get('/nhan-vien/me/thu-nhap');
                setIncomeData(res);
            } catch (err) {
                console.error('Lỗi tải thu nhập:', err);
            } finally {
                setLoading(false);
            }
        };

        const fetchNextShift = async () => {
            try {
                const res = await axiosClient.get('/nhan-vien/me/next-shift');
                setNextShift(res);
            } catch (err) {
                console.error('Lỗi tải ca làm tiếp theo:', err);
            }
        };

        if (user?.vaiTro === 'NV') {
            fetchIncome();
            fetchNextShift();
        } else {
            setLoading(false);
        }
    }, [user]);

    const formatVND = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    return (
        <div className="space-y-6">
            {/* Header / Welcome Section */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                <div className="max-w-2xl">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                        Xin chào, {user?.hoTen}
                    </h1>
                    <p className="text-gray-500 text-base font-medium">
                        Hệ thống Quản lý Nhân sự MiniMart. Chúc bạn một ngày làm việc hiệu quả.
                    </p>
                </div>
                <div className="hidden md:block">
                    <div className="bg-primary-50 text-primary-700 px-4 py-2 rounded-lg font-bold text-sm border border-primary-100">
                        {format(new Date(), 'EEEE, dd/MM/yyyy')}
                    </div>
                </div>
            </div>

            {/* Next Shift Notification for NV */}
            {user?.vaiTro === 'NV' && nextShift && (
                <div className="bg-white border border-gray-200 p-5 rounded-2xl flex items-center justify-between shadow-sm border-l-4 border-l-primary-600">
                    <div className="flex items-center gap-5">
                        <div className="p-3 bg-gray-50 text-gray-700 rounded-lg border border-gray-100">
                            <ClockIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-gray-900 font-bold text-base mb-0.5">Lịch làm việc sắp tới</p>
                            <div className="flex flex-wrap items-center gap-x-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1.5">
                                    <CalendarIcon className="w-4 h-4 text-primary-600" />
                                    <span className="font-semibold text-gray-700">
                                        {format(new Date(nextShift.ngay_lam), 'dd/MM/yyyy')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <ClockIcon className="w-4 h-4 text-primary-600" />
                                    <span className="font-medium">{nextShift.ten_ca}</span>
                                    <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-bold">
                                        {nextShift.gio_bat_dau.slice(0, 5)} - {nextShift.gio_ket_thuc.slice(0, 5)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={() => window.location.href = '/dang-ky-ca'}
                        className="hidden md:block text-primary-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-primary-50 transition-colors border border-primary-100"
                    >
                        Chi tiết
                    </button>
                </div>
            )}

            {/* Content for Employees (NV) */}
            {user?.vaiTro === 'NV' && (
                <div className="space-y-8">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <ArrowTrendingUpIcon className="w-5 h-5 text-primary-600" />
                            Hiệu suất & Thu nhập Tháng {new Date().getMonth() + 1}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard 
                            title="Thu nhập thực tế (Tạm tính)" 
                            value={loading ? '...' : formatVND(incomeData?.thu_nhap || 0)} 
                            icon={BanknotesIcon}
                            colorClass="bg-green-100 text-green-700"
                            subValue={`Đơn giá: ${formatVND(incomeData?.don_gia || 0)}/h`}
                        />
                        <StatCard 
                            title="Tổng số giờ làm" 
                            value={loading ? '...' : `${incomeData?.tong_gio || 0} giờ`} 
                            icon={ClockIcon}
                            colorClass="bg-blue-100 text-blue-700"
                        />
                        <StatCard 
                            title="Ca đã hoàn thành" 
                            value={loading ? '...' : `${incomeData?.tong_ca || 0} ca`} 
                            icon={CheckBadgeIcon}
                            colorClass="bg-purple-100 text-purple-700"
                            subValue="Đã được chấm công"
                        />
                         <StatCard 
                            title="Ngày trong tháng" 
                            value={`Ngày ${new Date().getDate()}`} 
                            icon={CalendarIcon}
                            colorClass="bg-orange-100 text-orange-700"
                            subValue={format(new Date(), 'EEEE')}
                        />
                    </div>

                    <div className="bg-primary-50 border border-primary-100 p-4 rounded-xl flex items-start gap-4">
                        <div className="p-2 bg-white rounded-lg text-primary-600 shrink-0 shadow-sm border border-primary-100">
                            <BanknotesIcon className="w-5 h-5" />
                        </div>
                        <p className="text-sm text-primary-800 leading-relaxed font-medium">
                            <strong>Mẹo nhỏ:</strong> Thu nhập này chỉ tính các ca bạn đã hoàn thành và được Quản lý xác nhận chấm công thành công. Hãy thường xuyên kiểm tra lịch cá nhân để không bỏ lỡ ca làm nhé!
                        </p>
                    </div>
                </div>
            )}

            {/* Content for Managers (QLC, CST) */}
            {(user?.vaiTro === 'QLC' || user?.vaiTro === 'CST') && (
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Lối tắt tác vụ Quản lý</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <QuickAction 
                            title="Duyệt đăng ký ca"
                            description="Kiểm tra và phê duyệt nguyện vọng đăng ký ca làm việc của nhân sự hàng tuần."
                            icon={ClipboardDocumentCheckIcon}
                            colorClass="bg-indigo-100 text-indigo-700"
                            onClick={() => window.location.href = '/duyet-ca'}
                        />
                        <QuickAction 
                            title="Chấm công thực tế"
                            description="Xác nhận giờ vào/ra và ghi chú hiệu suất làm việc của nhân sự trong ca."
                            icon={UserGroupIcon}
                            colorClass="bg-green-100 text-green-700"
                            onClick={() => window.location.href = '/cham-cong'}
                        />
                        {user?.vaiTro === 'CST' && (
                            <QuickAction 
                                title="Quản lý nhân viên"
                                description="Xem danh sách, hồ sơ và quản lý tài khoản của toàn bộ đội ngũ siêu thị."
                                icon={UserGroupIcon}
                                colorClass="bg-blue-100 text-blue-700"
                                onClick={() => window.location.href = '/nhan-vien'}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
