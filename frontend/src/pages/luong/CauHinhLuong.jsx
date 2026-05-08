import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import Table from '../../components/common/Table';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const CauHinhLuong = () => {
    const [cauHinhList, setCauHinhList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Lưu cấu hình mới
    const [formData, setFormData] = useState({
        don_gia_gio: ''
    });

    const fetchCauHinh = async () => {
        setLoading(true);
        try {
             const data = await axiosClient.get('/cau-hinh-luong');
             setCauHinhList(data);
             
             if (data.length > 0) {
                  // Mặc định nạp cấu hình mới nhất vào ô nhập
                  setFormData({
                       don_gia_gio: data[0].don_gia_gio ? data[0].don_gia_gio.toString() : '0'
                  });
             }
        } catch (err) {
             toast.error(err.message);
        } finally {
             setLoading(false);
        }
    };

    useEffect(() => {
        fetchCauHinh();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLuuCauHinh = async (e) => {
        e.preventDefault();
        
        const ok = window.confirm("Cấu hình này sẽ được áp dụng cho toàn hệ thống tính từ hôm nay. Bạn có chắc chắn?");
        if (!ok) return;

        setSaving(true);
        try {
            await axiosClient.post('/cau-hinh-luong', {
                 don_gia_gio: parseInt(formData.don_gia_gio),
                 ngay_ap_dung: format(new Date(), 'yyyy-MM-dd')
            });
            toast.success("Thay đổi cấu hình nhận lượng mới thành công");
            fetchCauHinh();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const columns = [
        { header: 'Ngày áp dụng', render: (row) => format(new Date(row.ngay_ap_dung), 'dd/MM/yyyy') },
        { 
            header: 'Mức lương cơ bản / giờ', 
            render: (row) => <span className="font-semibold text-gray-900">{parseInt(row.don_gia_gio).toLocaleString('vi-VN')} đ</span> 
        },
        {
            header: 'Trạng thái',
            render: (_, i) => i === 0 
                ? <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">Đang áp dụng</span> 
                : <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">Cũ</span>
        }
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Cấu hình lương</h1>
                <p className="mt-1 text-sm text-gray-500">Quy định mức lương cơ bản trên hệ thống.</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Áp dụng cấu hình mới</h3>
                <form onSubmit={handleLuuCauHinh} className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                     <div>
                          <label className="block text-sm font-medium text-gray-700">Lương cơ bản 1 giờ (VNĐ)</label>
                          <input 
                              type="number" required min={0} 
                              name="don_gia_gio"
                              value={formData.don_gia_gio} onChange={handleChange} 
                              className="mt-1 block w-full border-gray-300 rounded focus:ring-primary-500 border p-2" 
                           />
                     </div>
                     <div>
                         <button 
                             type="submit" disabled={saving}
                             className="w-full bg-primary-600 text-white rounded font-medium shadow-sm hover:bg-primary-700 disabled:bg-primary-300 px-4 py-2"
                          >
                             {saving ? "Đang lưu..." : "Áp dụng toàn hệ thống"}
                         </button>
                     </div>
                </form>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                     <h3 className="text-lg font-medium text-gray-900">Lịch sử cấu hình</h3>
                </div>
                {loading ? (
                    <div className="animate-pulse h-48 bg-gray-50"></div>
                ) : (
                    <Table columns={columns} data={cauHinhList} />
                )}
            </div>

        </div>
    );
};

export default CauHinhLuong;
