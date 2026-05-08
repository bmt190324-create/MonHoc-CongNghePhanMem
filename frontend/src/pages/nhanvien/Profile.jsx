import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import { 
    UserIcon, 
    CreditCardIcon, 
    IdentificationIcon, 
    KeyIcon, 
    PencilSquareIcon, 
    CheckIcon, 
    XMarkIcon,
    EyeIcon,
    EyeSlashIcon,
    BuildingLibraryIcon,
    BanknotesIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    ClockIcon
} from '@heroicons/react/24/outline';
import { ChartBarSquareIcon } from '@heroicons/react/24/solid';
import { format } from 'date-fns';

const Profile = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [finance, setFinance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [showSensitive, setShowSensitive] = useState({ cccd: false, bank: false });
    
    const [formData, setFormData] = useState({
        ho_ten: '',
        the_sinh_vien: '',
        cccd: '',
        so_tai_khoan: ''
    });

    const [passwordData, setPasswordData] = useState({
        mat_khau_cu: '',
        mat_khau_moi: '',
        xac_nhan_mat_khau: ''
    });
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    const fetchProfile = async () => {
        setLoading(true);
        const isMe = !id || parseInt(id) === user.id;
        const profileUrl = isMe ? '/nhan-vien/me/profile' : `/nhan-vien/${id}`;
        const financeUrl = isMe ? '/nhan-vien/me/finance' : `/nhan-vien/me/finance?nhan_vien_id=${id}`;

        // Load thông tin cá nhân
        try {
            const profileData = await axiosClient.get(profileUrl);
            setProfile(profileData);
            setFormData({
                ho_ten: profileData.ho_ten || '',
                the_sinh_vien: profileData.the_sinh_vien || '',
                cccd: profileData.cccd || '',
                so_tai_khoan: profileData.so_tai_khoan || ''
            });
        } catch (err) {
            toast.error('Lỗi tải thông tin cá nhân: ' + (err.response?.data?.message || err.message));
        }

        // Load thông tin tài chính
        try {
            const financeData = await axiosClient.get(financeUrl);
            setFinance(financeData);
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

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwordData.mat_khau_moi !== passwordData.xac_nhan_mat_khau) {
            toast.error('Mật khẩu xác nhận không khớp');
            return;
        }
        try {
            await axiosClient.put('/auth/doi-mat-khau', {
                mat_khau_cu: passwordData.mat_khau_cu,
                mat_khau_moi: passwordData.mat_khau_moi
            });
            toast.success('Đổi mật khẩu thành công');
            setIsPasswordModalOpen(false);
            setPasswordData({ mat_khau_cu: '', mat_khau_moi: '', xac_nhan_mat_khau: '' });
        } catch (err) {
            toast.error(err.message || 'Lỗi khi đổi mật khẩu');
        }
    };

    const maskValue = (value) => {
        if (!value) return 'Chưa cập nhật';
        return value.replace(/.(?=.{4})/g, '*');
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Đang tải thông tin cá nhân...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex justify-between items-end border-b border-gray-200 pb-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center shadow-inner">
                        <UserIcon className="w-10 h-10" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{profile?.ho_ten}</h1>
                        <p className="text-gray-500 flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-bold uppercase">{profile?.ten_vai_tro}</span>
                            <span>•</span>
                            <span className="text-sm">
                                Tham gia từ {profile?.ngay_tao ? format(new Date(profile.ngay_tao), 'dd/MM/yyyy') : '...'}
                            </span>
                        </p>
                    </div>
                </div>
            {(!id || parseInt(id) === user.id) && !editing && (
                <button 
                    onClick={() => setEditing(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                >
                    <PencilSquareIcon className="w-4 h-4" /> Chỉnh sửa
                </button>
            )}
            {editing && (!id || parseInt(id) === user.id) && (
                <div className="flex gap-2">
                     <button 
                        onClick={handleUpdateProfile}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition"
                    >
                        <CheckIcon className="w-4 h-4" /> Lưu
                    </button>
                    <button 
                        onClick={() => { setEditing(false); fetchProfile(); }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
                    >
                        <XMarkIcon className="w-4 h-4" /> Hủy
                    </button>
                </div>
            )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Cột trái: Thông tin tài khoản & Thống kê nhanh */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden text-center p-6">
                        <div className="mx-auto w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-4">
                            <BanknotesIcon className="w-8 h-8" />
                        </div>
                        <h4 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Tổng thu nhập năm {finance?.year}</h4>
                        <p className="text-2xl font-black text-gray-900 border-b border-gray-100 pb-3 mb-3">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(finance?.summary?.tong_da_nhan || 0)}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <span className="text-[10px] text-blue-600 uppercase font-bold block mb-1">Tổng thưởng</span>
                                <span className="text-sm font-bold text-blue-700">+{new Intl.NumberFormat('vi-VN').format(finance?.summary?.tong_thuong || 0)}</span>
                            </div>
                            <div className="p-2 bg-red-50 rounded-lg">
                                <span className="text-[10px] text-red-600 uppercase font-bold block mb-1">Tổng phạt</span>
                                <span className="text-sm font-bold text-red-700">-{new Intl.NumberFormat('vi-VN').format(finance?.summary?.tong_phat || 0)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-gray-700 text-sm uppercase tracking-wider">
                            Tài khoản
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Tên đăng nhập</label>
                                <p className="font-mono font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded border border-gray-100">{profile?.ten_dang_nhap}</p>
                            </div>
                            {(!id || parseInt(id) === user.id) && (
                                <button 
                                    onClick={() => setIsPasswordModalOpen(true)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-primary-100 bg-primary-50 text-primary-700 rounded-lg text-sm font-bold hover:bg-primary-100 transition"
                                >
                                    <KeyIcon className="w-4 h-4" /> Đổi mật khẩu
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Cột phải: Thông tin chi tiết & Lịch sử lương */}
                <div className="md:col-span-2 space-y-6">
                    <form onSubmit={handleUpdateProfile} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                         <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-gray-700 text-sm uppercase tracking-wider">
                            Thông tin cá nhân
                        </div>
                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 border-b border-gray-100">
                             <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Họ và tên</label>
                                {editing ? (
                                    <input 
                                        type="text" value={formData.ho_ten} 
                                        onChange={e => setFormData({...formData, ho_ten: e.target.value})}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    />
                                ) : (
                                    <p className="text-gray-900 font-medium px-4 py-2 bg-gray-50 rounded-lg border border-transparent">{profile?.ho_ten}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Thẻ sinh viên / MSNV</label>
                                {editing ? (
                                    <input 
                                        type="text" value={formData.the_sinh_vien} 
                                        onChange={e => setFormData({...formData, the_sinh_vien: e.target.value})}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    />
                                ) : (
                                    <p className="text-gray-900 font-medium px-4 py-2 bg-gray-50 rounded-lg border border-transparent">{profile?.the_sinh_vien || 'Chưa cập nhật'}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Số CCCD</label>
                                <div className="relative">
                                    {editing ? (
                                        <input 
                                            type="text" value={formData.cccd} 
                                            onChange={e => setFormData({...formData, cccd: e.target.value})}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 rounded-lg border border-transparent">
                                            <span className="text-gray-900 font-medium">
                                                {showSensitive.cccd ? profile?.cccd : maskValue(profile?.cccd)}
                                            </span>
                                            <button 
                                                type="button"
                                                onClick={() => setShowSensitive({...showSensitive, cccd: !showSensitive.cccd})}
                                                className="text-gray-400 hover:text-primary-600 transition"
                                            >
                                                {showSensitive.cccd ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <BuildingLibraryIcon className="w-4 h-4 text-gray-400" /> Số tài khoản Ngân hàng
                                </label>
                                <div className="relative">
                                    {editing ? (
                                        <input 
                                            type="text" value={formData.so_tai_khoan} 
                                            onChange={e => setFormData({...formData, so_tai_khoan: e.target.value})}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                            placeholder="Ví dụ: 123456789 - Vietcombank"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 rounded-lg border border-transparent">
                                            <span className="text-gray-900 font-medium">
                                                {showSensitive.bank ? profile?.so_tai_khoan : maskValue(profile?.so_tai_khoan)}
                                            </span>
                                            <button 
                                                type="button"
                                                onClick={() => setShowSensitive({...showSensitive, bank: !showSensitive.bank})}
                                                className="text-gray-400 hover:text-primary-600 transition"
                                            >
                                                {showSensitive.bank ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <p className="mt-2 text-xs text-gray-400 italic">* Thông tin này dùng để thực hiện chuyển khoản lương hàng tháng.</p>
                            </div>
                        </div>

                        {/* Lịch sử lương */}
                        <div className="p-4 bg-gray-50 border-b border-gray-100 font-bold text-gray-700 text-sm uppercase tracking-wider flex items-center gap-2">
                            <ChartBarSquareIcon className="w-5 h-5 text-indigo-500" /> Lịch sử lương năm {finance?.year}
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-100/50 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                                    <tr>
                                        <th className="px-6 py-3">Tháng</th>
                                        <th className="px-6 py-3">Phát hành</th>
                                        <th className="px-6 py-3 text-right">Tổng nhận</th>
                                        <th className="px-6 py-3 text-center">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {finance?.salaryHistory?.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-10 text-center text-gray-400 text-sm italic">
                                                Chưa có dữ liệu bảng lương trong năm nay.
                                            </td>
                                        </tr>
                                    ) : (
                                        finance?.salaryHistory?.map(s => (
                                            <tr key={s.thang} className="hover:bg-gray-50/50 transition">
                                                <td className="px-6 py-4 font-bold text-gray-900">Tháng {s.thang}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500">{format(new Date(s.ngay_tao), 'dd/MM/yyyy')}</td>
                                                <td className="px-6 py-4 text-right font-mono font-bold text-primary-600">
                                                    {new Intl.NumberFormat('vi-VN').format(s.tong_luong)}đ
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center">
                                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter
                                                            ${s.trang_thai === 'da_tra' ? 'bg-green-100 text-green-700' : 
                                                              s.trang_thai === 'da_duyet' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}
                                                        `}>
                                                            {s.trang_thai === 'da_tra' ? 'Đã nhận' : s.trang_thai === 'da_duyet' ? 'Chốt lương' : 'Đang duyệt'}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </form>
                </div>
            </div>

            {/* Modal đổi mật khẩu */}
            {isPasswordModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <KeyIcon className="w-5 h-5 text-primary-600" /> Đổi mật khẩu
                            </h3>
                            <button onClick={() => setIsPasswordModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleChangePassword} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu hiện tại</label>
                                <input 
                                    type="password" required
                                    value={passwordData.mat_khau_cu}
                                    onChange={e => setPasswordData({...passwordData, mat_khau_cu: e.target.value})}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                            <hr className="my-2 border-gray-100" />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
                                <input 
                                    type="password" required
                                    value={passwordData.mat_khau_moi}
                                    onChange={e => setPasswordData({...passwordData, mat_khau_moi: e.target.value})}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="Tối thiểu 8 ký tự"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu mới</label>
                                <input 
                                    type="password" required
                                    value={passwordData.xac_nhan_mat_khau}
                                    onChange={e => setPasswordData({...passwordData, xac_nhan_mat_khau: e.target.value})}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button 
                                    type="button" onClick={() => setIsPasswordModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
                                >
                                    Hủy
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition"
                                >
                                    Cập nhật
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
