import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import axiosClient from '../api/axiosClient';
import { useNavigate } from 'react-router-dom';
import { 
    BanknotesIcon, 
    ClockIcon, 
    CheckBadgeIcon, 
    CalendarIcon,
    ClipboardDocumentCheckIcon,
    UserGroupIcon,
    ChartBarIcon,
    BellAlertIcon,
    CurrencyDollarIcon,
    ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Payslip from '../components/payroll/Payslip';

const QuickAction = ({ title, description, icon: Icon, onClick, colorClass, disabled }) => (
    <button 
        onClick={onClick}
        disabled={disabled}
        className={`flex items-center gap-4 p-5 bg-white rounded-xl border border-gray-200 hover:border-primary-600 hover:shadow-sm transition-all duration-200 text-left w-full ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
        <div className={`p-2.5 rounded-lg ${colorClass} shrink-0`}>
            <Icon className="w-5 h-5" />
        </div>
        <div>
            <h4 className="font-bold text-gray-900 uppercase text-[10px] tracking-widest mb-0.5">
                {title} {disabled && '(Đang PT)'}
            </h4>
            <p className="text-sm text-gray-500 line-clamp-1">{description}</p>
        </div>
    </button>
);

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    
    // State cho NV
    const [incomeData, setIncomeData] = useState(null);
    const [nextShift, setNextShift] = useState(null);
    
    // State cho CST & QLC
    const [tongQuan, setTongQuan] = useState(null);
    const [chiPhiLuong, setChiPhiLuong] = useState([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                if (user?.vaiTro === 'NV') {
                    const [resIncome, resNextShift] = await Promise.all([
                        axiosClient.get('/nhan-vien/me/thu-nhap').catch(() => null),
                        axiosClient.get('/nhan-vien/me/next-shift').catch(() => null)
                    ]);
                    setIncomeData(resIncome);
                    setNextShift(resNextShift);
                } else if (user?.vaiTro === 'CST' || user?.vaiTro === 'QLC') {
                    const resTongQuan = await axiosClient.get('/thong-ke/tong-quan').catch(() => null);
                    setTongQuan(resTongQuan);
                    
                    if (user?.vaiTro === 'CST') {
                        const resChiPhi = await axiosClient.get('/thong-ke/chi-phi-luong?ky=thang').catch(() => []);
                        setChiPhiLuong(resChiPhi || []);
                    }
                }
            } catch (err) {
                console.error('Lỗi tải dashboard:', err);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchDashboardData();
        }
    }, [user]);

    const formatVND = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
    };

    if (loading) {
        return <LoadingSpinner fullScreen text="Đang tải dữ liệu tổng quan..." />;
    }

    const renderCSTDashboard = () => (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Tổng nhân sự" 
                    value={tongQuan?.tong_nhan_vien || 0} 
                    icon={UserGroupIcon}
                    colorClass="bg-blue-100 text-blue-700"
                    subValue={`${tongQuan?.nhan_vien_hoat_dong || 0} đang hoạt động`}
                />
                <StatCard 
                    title="Tổng giờ làm (Tháng)" 
                    value={`${tongQuan?.tong_gio_lam || 0} giờ`} 
                    icon={ClockIcon}
                    colorClass="bg-orange-100 text-orange-700"
                />
                <StatCard 
                    title="Chi phí lương (Tháng)" 
                    value={formatVND(tongQuan?.tong_chi_phi_luong || 0)} 
                    icon={BanknotesIcon}
                    colorClass="bg-red-100 text-red-700"
                />
                <StatCard 
                    title="Đăng ký ca mở" 
                    value={`${tongQuan?.tuan_dang_mo || 0} tuần`} 
                    icon={CalendarIcon}
                    colorClass="bg-green-100 text-green-700"
                    subValue={`${tongQuan?.chua_cham_cong || 0} ca chờ duyệt`}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <ChartBarIcon className="w-5 h-5 text-primary-600" />
                        Biểu đồ chi phí lương (2026)
                    </h3>
                    {chiPhiLuong && chiPhiLuong.length > 0 ? (
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chiPhiLuong}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="thang" tickFormatter={(v) => `T${v}`} axisLine={false} tickLine={false} />
                                    <YAxis 
                                        tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`} 
                                        axisLine={false} 
                                        tickLine={false}
                                    />
                                    <Tooltip 
                                        formatter={(value) => formatVND(value)}
                                        labelFormatter={(label) => `Tháng ${label}`}
                                        cursor={{fill: '#F3F4F6'}}
                                    />
                                    <Bar dataKey="tong_chi_phi" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="py-10">
                            <EmptyState 
                                icon={ChartBarIcon}
                                title="Chưa có dữ liệu lương"
                                description="Hệ thống cần có dữ liệu lương các tháng để vẽ biểu đồ."
                            />
                        </div>
                    )}
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Lối tắt tác vụ</h3>
                    <div className="space-y-4">
                        <QuickAction 
                            title="Quản lý nhân viên"
                            description="Xem danh sách nhân sự"
                            icon={UserGroupIcon}
                            colorClass="bg-blue-100 text-blue-700"
                            onClick={() => navigate('/nhan-vien')}
                        />
                        <QuickAction 
                            title="Bảng lương"
                            description="Tính lương tháng này"
                            icon={BanknotesIcon}
                            colorClass="bg-green-100 text-green-700"
                            onClick={() => navigate('/bang-luong')}
                        />
                        <QuickAction 
                            title="Thưởng / Phạt"
                            description="Ghi nhận ngoài giờ"
                            icon={CurrencyDollarIcon}
                            colorClass="bg-orange-100 text-orange-700"
                            onClick={() => navigate('/thuong-phat')}
                        />
                        <QuickAction 
                            title="Báo cáo thống kê"
                            description="Xem báo cáo chi tiết"
                            icon={ChartBarIcon}
                            colorClass="bg-purple-100 text-purple-700"
                            onClick={() => navigate('/thong-ke')}
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    const renderQLCDashboard = () => (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    title="Đăng ký chờ duyệt" 
                    value={`${tongQuan?.tuan_dang_mo || 0} tuần`} 
                    icon={CalendarIcon}
                    colorClass="bg-blue-100 text-blue-700"
                    subValue="Đang mở đăng ký"
                />
                <StatCard 
                    title="Chưa chấm công" 
                    value={`${tongQuan?.chua_cham_cong || 0} bản ghi`} 
                    icon={ClockIcon}
                    colorClass="bg-red-100 text-red-700"
                    subValue="Cần hoàn tất trong ngày"
                />
                <StatCard 
                    title="Thông báo mới" 
                    value="Xem" 
                    icon={BellAlertIcon}
                    colorClass="bg-yellow-100 text-yellow-700"
                    subValue="Bảng tin chung"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <ExclamationCircleIcon className="w-5 h-5 text-orange-500" />
                        Việc cần làm hôm nay
                    </h3>
                    {tongQuan?.tuan_dang_mo > 0 || tongQuan?.chua_cham_cong > 0 ? (
                        <div className="space-y-3">
                            {tongQuan?.tuan_dang_mo > 0 && (
                                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-blue-900">Duyệt đăng ký ca</p>
                                        <p className="text-sm text-blue-700">Có {tongQuan.tuan_dang_mo} tuần đang mở đăng ký.</p>
                                    </div>
                                    <button onClick={() => navigate('/duyet-ca')} className="px-3 py-1.5 bg-blue-600 text-white rounded shadow-sm text-sm font-medium">Xử lý</button>
                                </div>
                            )}
                            {tongQuan?.chua_cham_cong > 0 && (
                                <div className="p-4 bg-red-50 border border-red-100 rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-red-900">Chấm công nhân viên</p>
                                        <p className="text-sm text-red-700">Có {tongQuan.chua_cham_cong} ca làm việc chưa được chấm công.</p>
                                    </div>
                                    <button onClick={() => navigate('/cham-cong')} className="px-3 py-1.5 bg-red-600 text-white rounded shadow-sm text-sm font-medium">Chấm công</button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <EmptyState 
                            icon={CheckBadgeIcon}
                            title="Đã hoàn tất mọi việc"
                            description="Tuyệt vời! Không có việc gì khẩn cấp cần bạn xử lý lúc này."
                        />
                    )}
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Lối tắt tác vụ</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <QuickAction 
                            title="Duyệt ca"
                            description="Xếp lịch nhân viên"
                            icon={ClipboardDocumentCheckIcon}
                            colorClass="bg-indigo-100 text-indigo-700"
                            onClick={() => navigate('/duyet-ca')}
                        />
                        <QuickAction 
                            title="Chấm công"
                            description="Ghi nhận giờ làm"
                            icon={ClockIcon}
                            colorClass="bg-green-100 text-green-700"
                            onClick={() => navigate('/cham-cong')}
                        />
                        <QuickAction 
                            title="Hồ sơ"
                            description="Xem thông tin cá nhân"
                            icon={UserGroupIcon}
                            colorClass="bg-gray-100 text-gray-700"
                            onClick={() => navigate('/ho-so')}
                        />
                        <QuickAction 
                            title="Thông báo"
                            description="Tin tức chung"
                            icon={BellAlertIcon}
                            colorClass="bg-yellow-100 text-yellow-700"
                            onClick={() => navigate('/thong-bao')}
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    const renderNVDashboard = () => (
        <div className="space-y-8">
            {nextShift ? (
                <div className="bg-white border border-gray-200 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm border-l-4 border-l-primary-600">
                    <div className="flex items-center gap-5">
                        <div className="p-3 bg-primary-50 text-primary-600 rounded-xl border border-primary-100 hidden sm:block">
                            <CalendarIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-gray-500 font-medium text-sm mb-1 uppercase tracking-wider">Ca làm việc tiếp theo</p>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">{nextShift.ten_ca}</h3>
                            <div className="flex flex-wrap items-center gap-x-4 text-sm text-gray-600 font-medium">
                                <span className="flex items-center gap-1"><CalendarIcon className="w-4 h-4 text-gray-400" /> {format(new Date(nextShift.ngay_lam), 'dd/MM/yyyy')}</span>
                                <span className="flex items-center gap-1"><ClockIcon className="w-4 h-4 text-gray-400" /> {nextShift.gio_bat_dau?.slice(0, 5)} - {nextShift.gio_ket_thuc?.slice(0, 5)}</span>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={() => navigate('/dang-ky-ca')}
                        className="w-full md:w-auto bg-primary-50 text-primary-700 px-5 py-2.5 rounded-lg font-bold hover:bg-primary-100 transition-colors border border-primary-200"
                    >
                        Xem Lịch
                    </button>
                </div>
            ) : (
                <EmptyState 
                    icon={CalendarIcon}
                    title="Chưa có lịch làm việc"
                    description="Hiện tại bạn chưa được phân công ca làm việc nào tiếp theo."
                    action={<button onClick={() => navigate('/dang-ky-ca')} className="mt-2 text-primary-600 font-medium hover:underline">Đăng ký ca làm</button>}
                />
            )}

            <Payslip summaryData={incomeData} isEmployeeView={true} />

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Lối tắt tác vụ</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <QuickAction 
                        title="Đăng ký ca"
                        description="Xếp lịch cá nhân"
                        icon={CalendarIcon}
                        colorClass="bg-indigo-100 text-indigo-700"
                        onClick={() => navigate('/dang-ky-ca')}
                    />
                    <QuickAction 
                        title="Hồ sơ cá nhân"
                        description="Thông tin tài khoản"
                        icon={UserGroupIcon}
                        colorClass="bg-gray-100 text-gray-700"
                        onClick={() => navigate('/ho-so')}
                    />
                    <QuickAction 
                        title="Bảng tin chung"
                        description="Thông báo siêu thị"
                        icon={BellAlertIcon}
                        colorClass="bg-yellow-100 text-yellow-700"
                        onClick={() => navigate('/thong-bao')}
                    />
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <PageHeader 
                title={`Xin chào, ${user?.hoTen || 'Người dùng'}`} 
                description="Hệ thống Quản lý Nhân sự MiniMart. Chúc bạn một ngày làm việc hiệu quả."
                action={
                    <div className="hidden sm:block bg-white text-gray-700 px-4 py-2 rounded-lg font-medium text-sm border border-gray-200 shadow-sm">
                        Hôm nay: {format(new Date(), 'EEEE, dd/MM/yyyy')}
                    </div>
                }
            />

            {user?.vaiTro === 'CST' && renderCSTDashboard()}
            {user?.vaiTro === 'QLC' && renderQLCDashboard()}
            {user?.vaiTro === 'NV' && renderNVDashboard()}
        </div>
    );
};

export default Dashboard;
