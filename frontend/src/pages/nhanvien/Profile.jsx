import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import { 
    UserIcon, 
    KeyIcon, 
    PencilSquareIcon, 
    CheckIcon, 
    XMarkIcon,
    EyeIcon,
    EyeSlashIcon,
    BuildingLibraryIcon,
    BanknotesIcon,
} from '@heroicons/react/24/outline';
import { ChartBarSquareIcon } from '@heroicons/react/24/solid';
import { format } from 'date-fns';

import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import PasswordChangeModal from '../../components/profile/PasswordChangeModal';

const Profile = () => {
    const { id } = useParams();
    const { user } = useAuth();
    
    const [profile, setProfile] = useState(null);
    const [finance, setFinance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    
    const [editing, setEditing] = useState(false);
    const [showSensitive, setShowSensitive] = useState({ cccd: false, bank: false });
    
    const [formData, setFormData] = useState({
        ho_ten: '',
        the_sinh_vien: '',
        cccd: '',
        so_tai_khoan: ''
    });

    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    const isMe = !id || parseInt(id) === user.id;

    const fetchProfile = async () => {
        setLoading(true);
        setError(false);
        const profileUrl = isMe ? '/nhan-vien/me/profile' : `/nhan-vien/${id}`;
        const financeUrl = isMe ? '/nhan-vien/me/finance' : `/nhan-vien/me/finance?nhan_vien_id=${id}`;

        // Load thông tin cá nhân
        try {
            const profileData = await axiosClient.get(profileUrl);
            setProfile(profileData || null);
            if (profileData) {
                setFormData({
                    ho_ten: profileData.ho_ten || '',
                    the_sinh_vien: profileData.the_sinh_vien || '',
                    cccd: profileData.cccd || '',
                    so_tai_khoan: profileData.so_tai_khoan || ''
                });
            }
        } catch (err) {
            setError(true);
            toast.error('Lỗi tải thông tin cá nhân');
        }

        // Load thông tin tài chính (không block UI nếu lỗi)
        try {
            const financeData = await axiosClient.get(financeUrl);
            setFinance(financeData || null);
        } catch (err) {
            console.error('Finance loading error:', err);
        }
        
        setLoading(false);
    };

    useEffect(() => {
        fetchProfile();
    }, [id]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            await axiosClient.put('/nhan-vien/me/profile', formData);
            toast.success('Cập nhật thông tin thành công');
            setEditing(false);
            fetchProfile();
        } catch (err) {
            toast.error(err.message || 'Lỗi cập nhật');
        }
    };

    const maskValue = (value) => {
        if (!value) return 'Chưa cập nhật';
        return value.replace(/.(?=.{4})/g, '*');
    };

    const getInitial = (name) => {
        if (!name) return 'U';
        return name.charAt(0).toUpperCase();
    };

    if (loading) {
        return <LoadingSpinner text="Đang tải hồ sơ nhân viên..." fullScreen />;
    }

    if (error || !profile) {
        return (
            <div className="max-w-4xl mx-auto mt-10">
                <EmptyState 
                    icon={UserIcon}
                    title="Không tìm thấy hồ sơ"
                    description="Không thể tải thông tin hồ sơ lúc này. Vui lòng thử lại sau."
                />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header Profile */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="h-24 bg-gradient-to-r from-primary-500 to-primary-700"></div>
                <div className="px-6 pb-6 sm:px-8 flex flex-col sm:flex-row items-center sm:items-end sm:justify-between gap-4 -mt-12 relative z-10">
                    <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                        <div className="w-24 h-24 bg-white p-1 rounded-2xl shadow-md">
                            <div className="w-full h-full bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center text-4xl font-black">
                                {getInitial(profile.ho_ten)}
                            </div>
                        </div>
                        <div className="mt-2 sm:mt-0 sm:pt-12">
                            <h1 className="text-2xl font-bold text-gray-900">{profile.ho_ten || '—'}</h1>
                            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 mt-1">
                                <span className="px-2.5 py-0.5 bg-primary-100 text-primary-700 rounded-md text-xs font-bold uppercase tracking-wider">
                                    {profile.ten_vai_tro || '—'}
                                </span>
                                <span className="text-sm text-gray-500">•</span>
                                <span className="text-sm text-gray-500 font-medium">
                                    Tham gia từ {profile.ngay_tao ? format(new Date(profile.ngay_tao), 'dd/MM/yyyy') : '—'}
                                </span>
                                {profile.trang_thai === 'hoat_dong' ? (
                                    <span className="px-2 py-0.5 ml-2 bg-green-100 text-green-700 rounded text-[10px] font-bold uppercase">Đang hoạt động</span>
                                ) : profile.trang_thai ? (
                                    <span className="px-2 py-0.5 ml-2 bg-red-100 text-red-700 rounded text-[10px] font-bold uppercase">Ngừng hoạt động</span>
                                ) : null}
                            </div>
                        </div>
                    </div>
                    
                    {isMe && !editing && (
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button 
                                onClick={() => setIsPasswordModalOpen(true)}
                                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-200 transition"
                            >
                                <KeyIcon className="w-4 h-4" /> Đổi mật khẩu
                            </button>
                            <button 
                                onClick={() => setEditing(true)}
                                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700 transition shadow-sm"
                            >
                                <PencilSquareIcon className="w-4 h-4" /> Chỉnh sửa
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Thông tin cá nhân (Cột lớn) */}
                <div className="lg:col-span-2 space-y-6">
                    <form onSubmit={handleUpdateProfile} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-900">Thông tin cá nhân</h3>
                            {editing && (
                                <div className="flex gap-2">
                                    <button 
                                        type="button"
                                        onClick={() => { setEditing(false); fetchProfile(); }}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-md text-xs font-bold hover:bg-gray-200 transition"
                                    >
                                        <XMarkIcon className="w-4 h-4" /> Hủy
                                    </button>
                                    <button 
                                        type="submit"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white rounded-md text-xs font-bold hover:bg-primary-700 transition shadow-sm"
                                    >
                                        <CheckIcon className="w-4 h-4" /> Lưu thông tin
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-500 mb-1">Họ và tên</label>
                                {editing ? (
                                    <input 
                                        type="text" required
                                        value={formData.ho_ten} 
                                        onChange={e => setFormData({...formData, ho_ten: e.target.value})}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-shadow"
                                    />
                                ) : (
                                    <p className="text-gray-900 font-semibold px-4 py-2 bg-gray-50 rounded-lg border border-gray-100">{profile.ho_ten || '—'}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Thẻ sinh viên / MSNV</label>
                                {editing ? (
                                    <input 
                                        type="text" 
                                        value={formData.the_sinh_vien} 
                                        onChange={e => setFormData({...formData, the_sinh_vien: e.target.value})}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-shadow"
                                    />
                                ) : (
                                    <p className="text-gray-900 font-semibold px-4 py-2 bg-gray-50 rounded-lg border border-gray-100">{profile.the_sinh_vien || '—'}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Số CCCD</label>
                                <div className="relative group">
                                    {editing ? (
                                        <input 
                                            type="text" 
                                            value={formData.cccd} 
                                            onChange={e => setFormData({...formData, cccd: e.target.value})}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-shadow"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 rounded-lg border border-gray-100 transition-colors group-hover:border-gray-300">
                                            <span className="text-gray-900 font-semibold font-mono">
                                                {showSensitive.cccd ? (profile.cccd || '—') : maskValue(profile.cccd)}
                                            </span>
                                            <button 
                                                type="button"
                                                onClick={() => setShowSensitive({...showSensitive, cccd: !showSensitive.cccd})}
                                                className="text-gray-400 hover:text-gray-700 transition p-1 rounded hover:bg-gray-200"
                                                title={showSensitive.cccd ? "Ẩn CCCD" : "Hiển thị CCCD"}
                                            >
                                                {showSensitive.cccd ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="sm:col-span-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1">
                                    <BuildingLibraryIcon className="w-4 h-4" /> Số tài khoản Ngân hàng
                                </label>
                                <div className="relative group">
                                    {editing ? (
                                        <input 
                                            type="text" 
                                            value={formData.so_tai_khoan} 
                                            onChange={e => setFormData({...formData, so_tai_khoan: e.target.value})}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-shadow"
                                            placeholder="Ví dụ: 123456789 - Vietcombank"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 rounded-lg border border-gray-100 transition-colors group-hover:border-gray-300">
                                            <span className="text-gray-900 font-semibold font-mono">
                                                {showSensitive.bank ? (profile.so_tai_khoan || '—') : maskValue(profile.so_tai_khoan)}
                                            </span>
                                            <button 
                                                type="button"
                                                onClick={() => setShowSensitive({...showSensitive, bank: !showSensitive.bank})}
                                                className="text-gray-400 hover:text-gray-700 transition p-1 rounded hover:bg-gray-200"
                                                title={showSensitive.bank ? "Ẩn STK" : "Hiển thị STK"}
                                            >
                                                {showSensitive.bank ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </form>

                    {/* Lịch sử lương */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-gray-200 bg-gray-50/50 flex items-center gap-2">
                            <ChartBarSquareIcon className="w-5 h-5 text-primary-600" />
                            <h3 className="font-bold text-gray-900">Lịch sử lương năm {finance?.year || new Date().getFullYear()}</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left whitespace-nowrap">
                                <thead className="bg-gray-50 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                                    <tr>
                                        <th className="px-6 py-3">Tháng</th>
                                        <th className="px-6 py-3">Phát hành</th>
                                        <th className="px-6 py-3 text-right">Tổng nhận</th>
                                        <th className="px-6 py-3 text-center">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {(!finance || !finance.salaryHistory || finance.salaryHistory.length === 0) ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-10 text-center text-gray-500 text-sm">
                                                Chưa có dữ liệu bảng lương trong năm nay.
                                            </td>
                                        </tr>
                                    ) : (
                                        finance.salaryHistory.map(s => (
                                            <tr key={s.thang} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 font-bold text-gray-900">Tháng {s.thang}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {s.ngay_tao ? format(new Date(s.ngay_tao), 'dd/MM/yyyy') : '—'}
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono font-bold text-gray-900">
                                                    {new Intl.NumberFormat('vi-VN').format(s.tong_luong || 0)} đ
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center">
                                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide
                                                            ${s.trang_thai === 'da_tra' ? 'bg-green-100 text-green-700' : 
                                                              s.trang_thai === 'da_duyet' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}
                                                        `}>
                                                            {s.trang_thai === 'da_tra' ? 'Đã nhận' : s.trang_thai === 'da_duyet' ? 'Đã duyệt' : 'Bản nháp'}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Cột phải nhỏ: Tài khoản & Tổng quan năm */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center">
                        <div className="mx-auto w-12 h-12 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mb-3">
                            <BanknotesIcon className="w-6 h-6" />
                        </div>
                        <h4 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Tổng thu nhập năm {finance?.year || new Date().getFullYear()}</h4>
                        <p className="text-3xl font-black text-gray-900 border-b border-gray-100 pb-4 mb-4">
                            {new Intl.NumberFormat('vi-VN').format(finance?.summary?.tong_da_nhan || 0)} đ
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg">
                                <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Tổng thưởng</span>
                                <span className="text-sm font-bold text-green-600">+{new Intl.NumberFormat('vi-VN').format(finance?.summary?.tong_thuong || 0)}</span>
                            </div>
                            <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg">
                                <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Tổng phạt</span>
                                <span className="text-sm font-bold text-red-600">-{new Intl.NumberFormat('vi-VN').format(finance?.summary?.tong_phat || 0)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div className="p-5 border-b border-gray-200 bg-gray-50/50">
                            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Tài khoản truy cập</h3>
                        </div>
                        <div className="p-5">
                            <label className="text-xs font-medium text-gray-500 block mb-1">Tên đăng nhập (Username)</label>
                            <p className="font-mono font-bold text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">{profile.ten_dang_nhap || '—'}</p>
                            <p className="mt-3 text-xs text-gray-400">Tên đăng nhập do Ban quản lý cấp và không thể thay đổi.</p>
                        </div>
                    </div>
                </div>
            </div>

            <PasswordChangeModal 
                isOpen={isPasswordModalOpen} 
                onClose={() => setIsPasswordModalOpen(false)} 
            />
        </div>
    );
};

export default Profile;
