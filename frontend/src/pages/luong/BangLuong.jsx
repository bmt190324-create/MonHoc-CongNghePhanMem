import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import toast from 'react-hot-toast';

const BangLuong = () => {
    const [thang, setThang] = useState(new Date().getMonth() + 1);
    const [nam, setNam] = useState(new Date().getFullYear());
    const [bangLuongList, setBangLuongList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);

    const fetchBangLuong = async () => {
        setLoading(true);
        try {
            const data = await axiosClient.get(`/bang-luong?thang=${thang}&nam=${nam}`);
            setBangLuongList(data);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBangLuong();
    }, [thang, nam]);

    const handleTinhLuong = async () => {
        setProcessing(true);
        try {
            await axiosClient.post('/bang-luong/tinh-luong', { thang, nam });
            toast.success('Tính lương thành công');
            fetchBangLuong();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setProcessing(false);
        }
    };

    const handleStatusUpdate = async (id, status, label) => {
        if (status === 'da_tra' && !window.confirm(`Xác nhận đã thanh toán lương cho nhân viên này?`)) return;
        if (status === 'nhap' && !window.confirm(`Hủy duyệt lương? (Bản ghi sẽ quay về trạng thái Nháp)`)) return;

        try {
            await axiosClient.put(`/bang-luong/${id}/trang-thai`, { trang_thai: status });
            toast.success(`Đã chuyển sang trạng thái ${label}`);
            fetchBangLuong();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const columns = [
        { header: 'Nhân viên', accessor: 'ho_ten', className: 'font-medium' },
        { 
            header: 'Giờ làm', 
            render: (row) => <span className="font-semibold text-gray-700">{row.tong_gio_lam}h</span> 
        },
        { 
            header: 'Lương cơ bản', 
            render: (row) => <span className="text-gray-600">{parseInt(row.luong_co_ban || 0).toLocaleString('vi-VN')} đ</span> 
        },
        { 
            header: 'Thưởng / Phạt', 
            render: (row) => {
                const val = parseInt(row.tong_thuong_phat || 0);
                return (
                    <div className="text-sm">
                        {val > 0 && <div className="text-green-600">+{val.toLocaleString('vi-VN')}</div>}
                        {val < 0 && <div className="text-red-500">{val.toLocaleString('vi-VN')}</div>}
                        {val === 0 && <span className="text-gray-400">-</span>}
                    </div>
                )
            }
        },
        { 
            header: 'Tổng nhận', 
            render: (row) => <span className="font-bold text-primary-700">{parseInt(row.tong_luong || 0).toLocaleString('vi-VN')} đ</span> 
        },
        { header: 'Trạng thái', render: (row) => <Badge status={row.trang_thai} /> },
        {
            header: 'Hành động',
            render: (row) => (
                <div className="flex gap-2">
                    {/* Chuyển từ Nháp/Chờ duyệt sang Đã duyệt */}
                    {(row.trang_thai === 'nhap' || row.trang_thai === 'cho_duyet') && (
                        <button 
                            onClick={() => handleStatusUpdate(row.id, 'da_duyet', 'Đã duyệt')}
                            className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded text-sm hover:bg-green-100 font-medium"
                        >
                            Duyệt
                        </button>
                    )}

                    {/* Từ Đã duyệt sang Thanh toán hoặc quay lại Nháp */}
                    {row.trang_thai === 'da_duyet' && (
                        <>
                            <button 
                                onClick={() => handleStatusUpdate(row.id, 'da_tra', 'Đã thanh toán')}
                                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 font-medium shadow-sm transition-colors"
                            >
                                Thanh toán
                            </button>
                            <button 
                                onClick={() => handleStatusUpdate(row.id, 'nhap', 'Nháp')}
                                className="px-3 py-1 bg-white text-gray-600 border border-gray-300 rounded text-sm hover:bg-gray-50 font-medium transition-colors"
                            >
                                Hủy duyệt
                            </button>
                        </>
                    )}

                    {/* Cho phép hoàn tác từ Đã thanh toán về Đã duyệt nếu cần */}
                    {row.trang_thai === 'da_tra' && (
                        <button 
                            onClick={() => handleStatusUpdate(row.id, 'da_duyet', 'Đã duyệt')}
                            className="px-3 py-1 text-gray-400 hover:text-gray-600 text-xs font-medium"
                        >
                            Hoàn tác thanh toán
                        </button>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Bảng Lương</h1>
                    <p className="mt-1 text-sm text-gray-500">Tính toán và quản lý lương định kỳ cho nhân viên.</p>
                </div>
                <div className="flex gap-2">
                     <select 
                        value={thang} 
                        onChange={e => setThang(e.target.value)}
                        className="border-gray-300 rounded-md shadow-sm border px-3 py-2"
                    >
                        {Array.from({ length: 12 }).map((_, i) => (
                            <option key={i+1} value={i+1}>Tháng {i+1}</option>
                        ))}
                    </select>
                     <select 
                        value={nam} 
                        onChange={e => setNam(e.target.value)}
                        className="border-gray-300 rounded-md shadow-sm border px-3 py-2"
                    >
                        <option value={2026}>2026</option>
                        <option value={2027}>2027</option>
                    </select>
                </div>
            </div>

            <div className="bg-blue-50 p-4 border border-blue-100 rounded-lg flex justify-between items-center">
                <div className="text-sm text-blue-800">
                    <p><strong>Lưu ý:</strong> Nút "Tính Lương" sẽ tính toán lại toàn bộ dữ liệu chấm công và thưởng phạt trong tháng. Ca làm việc trễ giờ sẽ tự động bị phạt theo quy định.</p>
                </div>
                <button
                    onClick={handleTinhLuong}
                    disabled={processing}
                    className="shrink-0 bg-primary-600 text-white px-4 py-2 rounded shadow font-medium hover:bg-primary-700 disabled:bg-primary-300 transition-colors"
                >
                    {processing ? 'Đang tính...' : 'Bắt đầu Tính Lương'}
                </button>
            </div>

            {loading ? (
                <div className="animate-pulse h-48 bg-gray-200 rounded-lg"></div>
            ) : bangLuongList.length === 0 ? (
                 <div className="text-center p-8 text-gray-500 bg-white rounded-lg border border-gray-100">
                    Chưa có dữ liệu lương của Tháng {thang}/{nam}. Vui lòng bấm Tính Lương.
                 </div>
            ) : (
                <Table columns={columns} data={bangLuongList} />
            )}
        </div>
    );
};

export default BangLuong;
