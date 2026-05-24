import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../hooks/useAuth';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';
import { MegaphoneIcon, PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import SearchInput from '../../components/common/SearchInput';
import FilterSelect from '../../components/common/FilterSelect';
import NotificationCard from '../../components/notifications/NotificationCard';

const ThongBao = () => {
    const { user } = useAuth();
    const canPost = user?.vaiTro === 'QLC' || user?.vaiTro === 'CST';
    
    const [thongBaos, setThongBaos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ tieu_de: '', noi_dung: '', muc_do: 'info' });

    const [searchTerm, setSearchTerm] = useState('');
    const [levelFilter, setLevelFilter] = useState('');

    const levelOptions = [
        { value: '', label: 'Tất cả mức độ' },
        { value: 'info', label: 'Thông tin (Xanh)' },
        { value: 'warning', label: 'Lưu ý (Vàng)' },
        { value: 'urgent', label: 'Khẩn cấp (Đỏ)' }
    ];

    const filteredThongBaos = thongBaos.filter(tb => {
        const term = searchTerm.trim().toLowerCase();
        const tieuDe = tb.tieu_de || '';
        const noiDung = tb.noi_dung || '';
        const matchSearch = term === '' || 
            tieuDe.toLowerCase().includes(term) ||
            noiDung.toLowerCase().includes(term);
        if (!matchSearch) return false;

        const mucDo = tb.muc_do || 'info';
        if (levelFilter && mucDo !== levelFilter) return false;

        return true;
    });

    const fetchThongBao = async () => {
        setLoading(true);
        try {
            const data = await axiosClient.get('/thong-bao');
            // Đảm bảo data là array
            setThongBaos(Array.isArray(data) ? data : []);
        } catch (err) {
            toast.error('Lỗi tải thông báo');
            setThongBaos([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchThongBao();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axiosClient.post('/thong-bao', formData);
            toast.success('Đã đăng thông báo mới');
            setIsModalOpen(false);
            setFormData({ tieu_de: '', noi_dung: '', muc_do: 'info' });
            fetchThongBao();
        } catch (err) {
            toast.error(err.message || 'Lỗi khi đăng thông báo');
        }
    };

    const handleTogglePin = async (id) => {
        try {
            await axiosClient.patch(`/thong-bao/${id}/pin`);
            toast.success('Đã cập nhật trạng thái ghim');
            fetchThongBao();
        } catch (err) {
            toast.error('Lỗi khi ghim thông báo');
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <PageHeader 
                title="Thông báo nội bộ"
                description="Bảng tin chung của hệ thống, cập nhật nhanh các sự kiện và chỉ thị."
                action={
                    canPost && (
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="inline-flex items-center justify-center bg-primary-600 text-white px-4 py-2.5 rounded-lg hover:bg-primary-700 transition shadow-sm font-bold text-sm"
                        >
                            <PlusIcon className="w-5 h-5 mr-1" /> Đăng thông báo
                        </button>
                    )
                }
            />

            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-4 sticky top-16 z-10">
                <SearchInput 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    placeholder="Tìm theo tiêu đề, nội dung..." 
                />
                <div className="flex flex-1 gap-4 sm:justify-end">
                    <FilterSelect 
                        value={levelFilter} 
                        onChange={e => setLevelFilter(e.target.value)} 
                        options={levelOptions} 
                    />
                </div>
            </div>

            <div className="space-y-5">
                {loading ? (
                    <div className="py-12">
                        <LoadingSpinner text="Đang tải thông báo..." />
                    </div>
                ) : thongBaos.length === 0 ? (
                    <EmptyState 
                        icon={MegaphoneIcon}
                        title="Chưa có thông báo nào"
                        description="Hiện tại hệ thống chưa có thông báo chung nào. Hãy quay lại sau!"
                    />
                ) : filteredThongBaos.length === 0 ? (
                    <EmptyState 
                        icon={MagnifyingGlassIcon}
                        title="Không tìm thấy thông báo"
                        description={`Không có kết quả nào cho "${searchTerm}" hoặc bộ lọc hiện tại.`}
                        action={<button onClick={() => {setSearchTerm(''); setLevelFilter('');}} className="text-primary-600 font-medium hover:underline mt-2">Xóa bộ lọc</button>}
                    />
                ) : (
                    filteredThongBaos.map(tb => (
                        <NotificationCard 
                            key={tb.id} 
                            notification={tb} 
                            canPost={canPost} 
                            onTogglePin={handleTogglePin} 
                        />
                    ))
                )}
            </div>

            {canPost && (
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Đăng Thông Báo Mới" maxWidth="max-w-2xl">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mức độ cảnh báo</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { val: 'info', label: 'Thông tin', color: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 ring-blue-500' },
                                        { val: 'warning', label: 'Lưu ý', color: 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100 ring-yellow-500' },
                                        { val: 'urgent', label: 'Khẩn cấp', color: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100 ring-red-500' }
                                    ].map(opt => (
                                        <button
                                            key={opt.val}
                                            type="button"
                                            onClick={() => setFormData({...formData, muc_do: opt.val})}
                                            className={`py-2 px-3 border rounded-xl font-bold text-sm transition-all focus:outline-none ${formData.muc_do === opt.val ? `ring-2 ${opt.color}` : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề *</label>
                                <input 
                                    type="text" required
                                    value={formData.tieu_de} onChange={e => setFormData({...formData, tieu_de: e.target.value})}
                                    className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="Ví dụ: Lịch nghỉ lễ sắp tới"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung *</label>
                                <textarea 
                                    required rows={6}
                                    value={formData.noi_dung} onChange={e => setFormData({...formData, noi_dung: e.target.value})}
                                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none leading-relaxed"
                                    placeholder="Nhập nội dung chi tiết của thông báo..."
                                />
                            </div>
                        </div>
                        <div className="pt-5 flex justify-end gap-3 border-t border-gray-100">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 font-medium text-gray-700">Hủy bỏ</button>
                            <button type="submit" className="px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-bold shadow-sm">Đăng thông báo</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default ThongBao;
