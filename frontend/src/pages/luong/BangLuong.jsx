import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import toast from 'react-hot-toast';
import PageHeader from '../../components/common/PageHeader';
import SkeletonTable from '../../components/common/SkeletonTable';
import EmptyState from '../../components/common/EmptyState';
import { DocumentTextIcon, MagnifyingGlassIcon, EyeIcon } from '@heroicons/react/24/outline';
import SearchInput from '../../components/common/SearchInput';
import FilterSelect from '../../components/common/FilterSelect';
import Modal from '../../components/common/Modal';
import Payslip from '../../components/payroll/Payslip';

const BangLuong = () => {
    const [thang, setThang] = useState(new Date().getMonth() + 1);
    const [nam, setNam] = useState(new Date().getFullYear());
    const [bangLuongList, setBangLuongList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [selectedBangLuong, setSelectedBangLuong] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const statusOptions = [
        { value: '', label: 'Tất cả trạng thái' },
        { value: 'nhap', label: 'Nháp' },
        { value: 'da_duyet', label: 'Đã duyệt' },
        { value: 'da_tra', label: 'Đã thanh toán' }
    ];

    const filteredBangLuongList = bangLuongList.filter(row => {
        const term = searchTerm.trim().toLowerCase();
        const matchSearch = term === '' || (row.ho_ten && row.ho_ten.toLowerCase().includes(term));
        if (!matchSearch) return false;

        if (statusFilter && row.trang_thai !== statusFilter) return false;

        return true;
    });

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
                <div className="flex gap-2 items-center">
                    <button
                        onClick={() => setSelectedBangLuong(row)}
                        className="p-1.5 text-gray-500 hover:text-primary-600 bg-gray-50 hover:bg-primary-50 rounded transition-colors"
                        title="Chi tiết phiếu lương"
                    >
                        <EyeIcon className="w-5 h-5" />
                    </button>
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
            <PageHeader 
                title="Bảng Lương"
                description="Tính toán và quản lý lương định kỳ cho nhân viên."
                action={
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
                }
            />

            <div className="bg-blue-50 p-4 border border-blue-100 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-4">
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

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <SearchInput 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    placeholder="Tìm tên nhân viên..." 
                />
                <div className="flex flex-1 gap-4 sm:justify-end">
                    <FilterSelect 
                        value={statusFilter} 
                        onChange={e => setStatusFilter(e.target.value)} 
                        options={statusOptions} 
                    />
                </div>
            </div>

            {loading ? (
                <SkeletonTable columns={7} rows={4} />
            ) : bangLuongList.length === 0 ? (
                 <EmptyState 
                    icon={DocumentTextIcon}
                    title="Chưa có dữ liệu lương"
                    description={`Chưa có dữ liệu lương của Tháng ${thang}/${nam}. Vui lòng bấm Bắt đầu Tính Lương.`}
                 />
            ) : filteredBangLuongList.length === 0 ? (
                 <EmptyState 
                    icon={MagnifyingGlassIcon}
                    title="Không tìm thấy bảng lương"
                    description="Thử thay đổi từ khóa hoặc bộ lọc trạng thái để xem kết quả."
                 />
            ) : (
                <Table columns={columns} data={filteredBangLuongList} />
            )}

            <Modal 
                isOpen={!!selectedBangLuong} 
                onClose={() => setSelectedBangLuong(null)} 
                title="Chi tiết Phiếu Lương"
                maxWidth="max-w-3xl"
            >
                <div className="-mx-6 -mt-2">
                    <Payslip bangLuong={selectedBangLuong} />
                </div>
                <div className="mt-6 flex justify-end">
                    <button 
                        onClick={() => setSelectedBangLuong(null)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                    >
                        Đóng
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default BangLuong;
