import React from 'react';
import { format } from 'date-fns';
import { 
    BanknotesIcon, 
    CalendarIcon, 
    ClockIcon, 
    CurrencyDollarIcon,
    ExclamationCircleIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

const formatVND = (amount) => {
    return parseInt(amount || 0).toLocaleString('vi-VN') + ' đ';
};

const Payslip = ({ bangLuong, summaryData, isEmployeeView }) => {
    // Nếu là chế độ nhân viên và chưa có bảng lương chi tiết (chỉ có summary)
    if (isEmployeeView && !bangLuong && summaryData) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 w-full">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                    <div className="p-3 bg-primary-50 text-primary-600 rounded-lg">
                        <BanknotesIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Tổng quan thu nhập tháng này</h2>
                        <p className="text-sm text-gray-500">Chi tiết phiếu lương hiện chưa được phát hành.</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                        <span className="text-sm text-gray-500 font-medium flex items-center gap-1.5 mb-1"><ClockIcon className="w-4 h-4"/> Tổng giờ làm</span>
                        <div className="text-2xl font-bold text-gray-800">{summaryData.tong_gio || 0}h</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                        <span className="text-sm text-gray-500 font-medium flex items-center gap-1.5 mb-1"><CalendarIcon className="w-4 h-4"/> Số ca hoàn thành</span>
                        <div className="text-2xl font-bold text-gray-800">{summaryData.tong_ca || 0} ca</div>
                    </div>
                </div>
                
                <div className="bg-primary-50 rounded-lg p-6 border border-primary-100 flex justify-between items-center relative overflow-hidden">
                    <div className="relative z-10">
                        <span className="text-sm text-primary-600 font-bold uppercase tracking-wider mb-1 block">Thu nhập tạm tính</span>
                        <div className="text-3xl font-extrabold text-primary-700">{formatVND(summaryData.thu_nhap)}</div>
                    </div>
                    <div className="absolute right-[-10px] bottom-[-10px] opacity-10">
                        <CurrencyDollarIcon className="w-32 h-32 text-primary-600" />
                    </div>
                </div>

                <div className="mt-4 flex items-start gap-2 text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
                    <ExclamationCircleIcon className="w-5 h-5 shrink-0" />
                    <p>Lưu ý: Thu nhập tạm tính dựa trên số ca đã hoàn thành. Hệ thống chưa áp dụng các khoản thưởng phạt và có thể thay đổi khi phiếu lương chính thức được Quản lý duyệt.</p>
                </div>
            </div>
        );
    }

    if (!bangLuong) return null;

    // Chế độ xem chi tiết phiếu lương (khi có đủ data)
    const getStatusStyle = (status) => {
        switch (status) {
            case 'da_tra': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'da_duyet': return 'bg-green-100 text-green-800 border-green-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };
    
    const getStatusLabel = (status) => {
        switch (status) {
            case 'da_tra': return 'Đã thanh toán';
            case 'da_duyet': return 'Đã duyệt';
            default: return 'Bản Nháp';
        }
    };

    const thuongPhat = parseInt(bangLuong.tong_thuong_phat || 0);
    const luongCoBan = parseInt(bangLuong.luong_co_ban || 0);
    const tongLuong = parseInt(bangLuong.tong_luong || 0);

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden w-full mx-auto">
            {/* Header */}
            <div className="bg-gray-50 border-b border-gray-200 p-6 sm:px-8">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">Phiếu Lương Tháng {bangLuong.thang || '—'}/{bangLuong.nam || '—'}</h2>
                        <div className="text-sm text-gray-500 font-medium">
                            Ngày tạo: {bangLuong.ngay_tao ? format(new Date(bangLuong.ngay_tao), 'dd/MM/yyyy') : '—'}
                        </div>
                    </div>
                    <div className={`px-4 py-1.5 rounded-full border font-bold text-sm text-center w-fit ${getStatusStyle(bangLuong.trang_thai)}`}>
                        {getStatusLabel(bangLuong.trang_thai)}
                    </div>
                </div>
            </div>

            <div className="p-6 sm:p-8 space-y-8">
                {/* Info Nhan Vien */}
                <div className="grid grid-cols-2 gap-6 bg-white p-4 rounded-lg border border-gray-100">
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Nhân viên</p>
                        <p className="text-lg font-bold text-gray-900">{bangLuong.ho_ten || '—'}</p>
                        {bangLuong.ten_vai_tro && (
                            <p className="text-sm text-gray-600 mt-0.5">{bangLuong.ten_vai_tro}</p>
                        )}
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Tổng giờ làm</p>
                        <p className="text-lg font-bold text-gray-900">{bangLuong.tong_gio_lam || 0} giờ</p>
                        <p className="text-sm text-gray-600 mt-0.5">{formatVND(bangLuong.don_gia_ap_dung)} / giờ</p>
                    </div>
                </div>

                {/* Salary Breakdown */}
                <div>
                    <h3 className="text-base font-bold text-gray-900 mb-4 border-b pb-2">Chi tiết thu nhập</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-2">
                            <span className="text-gray-600 font-medium">Lương cơ bản (Theo giờ)</span>
                            <span className="font-semibold text-gray-900">{formatVND(luongCoBan)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center py-2">
                            <span className="text-gray-600 font-medium flex items-center gap-2">
                                Thưởng / Phạt trong tháng
                                {thuongPhat > 0 ? <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" /> : thuongPhat < 0 ? <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" /> : null}
                            </span>
                            <span className={`font-semibold ${thuongPhat > 0 ? 'text-green-600' : thuongPhat < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                                {thuongPhat > 0 ? '+' : ''}{formatVND(thuongPhat)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Total */}
                <div className="bg-primary-50 rounded-xl p-6 flex flex-col sm:flex-row justify-between sm:items-center border border-primary-100 gap-4">
                    <span className="text-lg font-bold text-primary-900">Tổng thực nhận</span>
                    <span className="text-3xl font-extrabold text-primary-700">{formatVND(tongLuong)}</span>
                </div>
            </div>
        </div>
    );
};

export default Payslip;
