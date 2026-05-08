import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';
import { PlusIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const ThuongPhat = () => {
    const [thuongPhatList, setThuongPhatList] = useState([]);
    const [nhanViens, setNhanViens] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const [formData, setFormData] = useState({
        nhan_vien_id: '',
        loai: 'thuong',
        so_tien: '',
        ly_do: '',
        ngay: format(new Date(), 'yyyy-MM-dd')
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [tp, nvs] = await Promise.all([
                axiosClient.get('/thuong-phat'),
                axiosClient.get('/nhan-vien')
            ]);
            setThuongPhatList(tp);
            setNhanViens(nvs);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (!formData.nhan_vien_id) {
                toast.error('Vui lòng chọn nhân viên');
                return;
            }
            await axiosClient.post('/thuong-phat', formData);
            toast.success('Thêm thành công');
            fetchData();
            setIsModalOpen(false);
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa?')) return;
        try {
            await axiosClient.delete(`/thuong-phat/${id}`);
            toast.success('Xóa thành công');
            fetchData();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const columns = [
        { header: 'Ngày Ghi Nhận', render: (row) => format(new Date(row.ngay), 'dd/MM/yyyy') },
        { header: 'Nhân viên', accessor: 'ho_ten', className: 'font-medium text-gray-900' },
        { 
            header: 'Loại', 
            render: (row) => (
                <span className={`inline-block px-2 text-xs py-1 rounded font-medium ${row.loai === 'thuong' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {row.loai === 'thuong' ? 'Thưởng' : 'Phạt'}
                </span>
            ) 
        },
        { 
            header: 'Số tiền', 
            render: (row) => <span className={`font-semibold ${row.loai === 'thuong' ? 'text-green-600' : 'text-red-500'}`}>
                {row.loai === 'thuong' ? '+' : '-'}{parseInt(row.so_tien).toLocaleString('vi-VN')}
            </span> 
        },
        { header: 'Lý do', accessor: 'ly_do', className: 'text-gray-500 max-w-xs truncate' },
        {
            header: 'Hành động',
            render: (row) => (
                <button 
                    onClick={() => handleDelete(row.id)}
                    className="text-red-600 hover:text-red-800 font-medium text-sm"
                >
                    Xóa
                </button>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Thưởng / Phạt</h1>
                    <p className="mt-1 text-sm text-gray-500">Quản lý các khoản thưởng và khấu trừ ngoài giờ.</p>
                </div>
                <button 
                    onClick={() => {
                        setFormData({nhan_vien_id: '', loai: 'thuong', so_tien: '', ly_do: '', ngay: format(new Date(), 'yyyy-MM-dd')});
                        setIsModalOpen(true);
                    }}
                    className="inline-flex items-center justify-center bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors shadow-sm font-medium"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Thêm bản ghi
                </button>
            </div>

            {loading ? (
                <div className="animate-pulse h-48 bg-gray-200 rounded-lg"></div>
            ) : (
                <Table columns={columns} data={thuongPhatList} />
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Thêm Thưởng / Phạt">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nhân viên *</label>
                        <select name="nhan_vien_id" required value={formData.nhan_vien_id} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded focus:ring-primary-500 border p-2 bg-white flex-1 min-w-0 border-r-0">
                            <option value="">-- Chọn --</option>
                            {nhanViens.map(nv => (
                                <option key={nv.id} value={nv.id}>{nv.ho_ten} ({nv.ten_dang_nhap})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Loại *</label>
                        <select name="loai" required value={formData.loai} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded focus:ring-primary-500 border p-2 bg-white">
                            <option value="thuong">Thưởng</option>
                            <option value="phat">Phạt</option>
                        </select>
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-gray-700">Ngày ghi nhận *</label>
                         <input type="date" name="ngay" required value={formData.ngay} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded focus:ring-primary-500 border p-2" />
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-gray-700">Số tiền (VNĐ) *</label>
                         <input type="number" name="so_tien" required min={0} value={formData.so_tien} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded focus:ring-primary-500 border p-2" />
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-gray-700">Lý do</label>
                         <textarea name="ly_do" rows={3} value={formData.ly_do} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded focus:ring-primary-500 border p-2"></textarea>
                    </div>
                    
                    <div className="pt-4 flex justify-end gap-3 border-t border-gray-200 mt-6">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded bg-white font-medium hover:bg-gray-50">Hủy</button>
                        <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded font-medium hover:bg-primary-700">Lưu</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ThuongPhat;
