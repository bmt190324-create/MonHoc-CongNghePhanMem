import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../hooks/useAuth';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';
import { MegaphoneIcon, PlusIcon, InformationCircleIcon, ExclamationTriangleIcon, BellAlertIcon } from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { BookmarkIcon as BookmarkOutlineIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const ThongBao = () => {
    const { user } = useAuth();
    const canPost = user?.vaiTro === 'QLC' || user?.vaiTro === 'CST';
    
    const [thongBaos, setThongBaos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ tieu_de: '', noi_dung: '', muc_do: 'info' });

    const fetchThongBao = async () => {
        setLoading(true);
        try {
            const data = await axiosClient.get('/thong-bao');
            setThongBaos(data);
        } catch (err) {
            toast.error('Lỗi tải thông báo');
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
            toast.error(err.message);
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

    const getMucDoStyle = (muc_do) => {
        switch (muc_do) {
            case 'urgent': return { icon: <BellAlertIcon className="w-6 h-6 text-red-500" />, bg: 'bg-red-50 border-red-100', text: 'text-red-700' };
            case 'warning': return { icon: <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500" />, bg: 'bg-yellow-50 border-yellow-100', text: 'text-yellow-700' };
            default: return { icon: <InformationCircleIcon className="w-6 h-6 text-blue-500" />, bg: 'bg-blue-50 border-blue-50', text: 'text-blue-700' };
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                        <MegaphoneIcon className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Bảng Thông Báo Chung</h1>
                        <p className="text-sm text-gray-500 mt-1">Nơi trao đổi và cập nhật thông tin chung toàn hệ thống.</p>
                    </div>
                </div>
                {canPost && (
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center justify-center bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
                    >
                        <PlusIcon className="w-5 h-5 mr-1" /> Soạn thông báo mới
                    </button>
                )}
            </div>

            <div className="space-y-4">
                {loading ? (
                    [1,2,3].map(i => (
                        <div key={i} className="animate-pulse bg-white p-5 rounded-xl border border-gray-100 flex gap-4">
                            <div className="w-12 h-12 bg-gray-200 rounded-full shrink-0"></div>
                            <div className="space-y-2 flex-1">
                                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                                <div className="h-16 bg-gray-200 rounded w-full mt-4"></div>
                            </div>
                        </div>
                    ))
                ) : thongBaos.length === 0 ? (
                    <div className="text-center bg-white p-10 rounded-xl border border-gray-100 shadow-sm text-gray-500">
                        Chưa có thông báo nào.
                    </div>
                ) : (
                    thongBaos.map(tb => {
                        const style = getMucDoStyle(tb.muc_do);
                        return (
                            <div key={tb.id} className={`p-5 rounded-xl border shadow-sm flex gap-4 transition-all relative ${style.bg} ${tb.is_pinned ? 'ring-2 ring-primary-500' : ''}`}>
                                {tb.is_pinned && (
                                    <div className="absolute top-0 right-10 -translate-y-1/2 bg-primary-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm uppercase tracking-wider flex items-center gap-1">
                                        <BookmarkSolidIcon className="w-3 h-3" /> Được ghim
                                    </div>
                                )}
                                <div className="shrink-0 pt-1">{style.icon}</div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className={`text-lg font-bold mb-1 ${style.text}`}>{tb.tieu_de}</h3>
                                        {canPost && (
                                            <button 
                                                onClick={() => handleTogglePin(tb.id)}
                                                className={`p-1.5 rounded-lg transition-colors ${tb.is_pinned ? 'text-primary-600 bg-primary-50 hover:bg-primary-100' : 'text-gray-400 hover:bg-gray-100'}`}
                                                title={tb.is_pinned ? "Bỏ ghim" : "Ghim lên đầu"}
                                            >
                                                {tb.is_pinned ? <BookmarkSolidIcon className="w-5 h-5" /> : <BookmarkOutlineIcon className="w-5 h-5" />}
                                            </button>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-500 flex items-center gap-2 mb-3">
                                        <span className="font-semibold text-gray-700">{tb.nguoi_tao_ten}</span>
                                        <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 uppercase tracking-tighter">{tb.nguoi_tao_vai_tro}</span>
                                        <span>•</span>
                                        <span>{formatDistanceToNow(new Date(tb.ngay_tao), { addSuffix: true, locale: vi })}</span>
                                    </div>
                                    <p className="text-gray-800 whitespace-pre-line text-sm leading-relaxed bg-white/50 p-3 rounded border border-black/5 shadow-inner">{tb.noi_dung}</p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {canPost && (
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Đăng Thông Báo">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Mức độ cảnh báo</label>
                            <select 
                                value={formData.muc_do} 
                                onChange={e => setFormData({...formData, muc_do: e.target.value})}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded focus:ring-primary-500"
                            >
                                <option value="info">Thông tin (Xanh)</option>
                                <option value="warning">Lưu ý (Vàng)</option>
                                <option value="urgent">Khẩn cấp (Đỏ)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Tiêu đề *</label>
                            <input 
                                type="text" required
                                value={formData.tieu_de} onChange={e => setFormData({...formData, tieu_de: e.target.value})}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded focus:ring-primary-500"
                                placeholder="Tiêu đề thông báo..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nội dung *</label>
                            <textarea 
                                required rows={5}
                                value={formData.noi_dung} onChange={e => setFormData({...formData, noi_dung: e.target.value})}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded focus:ring-primary-500"
                                placeholder="Bạn muốn thông báo điều gì?"
                            />
                        </div>
                        <div className="pt-4 flex justify-end gap-3 border-t border-gray-200 mt-6">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded bg-white hover:bg-gray-50 font-medium">Hủy</button>
                            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 font-medium">Đăng ngay</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}

export default ThongBao;
