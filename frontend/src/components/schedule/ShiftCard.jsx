import React from 'react';
import { Link } from 'react-router-dom';
import { CheckIcon, XMarkIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';

const ShiftCard = ({ khungCa, cellData, isLocked, handleDuyet, selectedTuanInfo }) => {
    const approvedCount = cellData.filter(reg => reg.trang_thai === 'da_duyet').length;
    const minNv = khungCa.min_nv || 2;
    const isHoanThanh = selectedTuanInfo?.trang_thai === 'hoan_thanh';

    let statusText = '';
    let statusColor = '';

    if (isHoanThanh) {
        statusText = 'Hoàn thành';
        statusColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
    } else if (approvedCount === 0 && cellData.length === 0) {
        statusText = 'Trống';
        statusColor = 'bg-gray-100 text-gray-600 border-gray-200';
    } else if (approvedCount < minNv) {
        statusText = 'Thiếu người';
        statusColor = 'bg-amber-100 text-amber-800 border-amber-200';
    } else {
        statusText = 'Đủ người';
        statusColor = 'bg-green-100 text-green-800 border-green-200';
    }

    const getRegStatusStyle = (trang_thai) => {
        if (trang_thai === 'da_duyet') return 'bg-green-50 border-green-200 text-green-800';
        if (trang_thai === 'tu_choi') return 'bg-red-50 border-red-200 text-red-800 opacity-60';
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-3">
                 <span className="text-xs font-semibold text-gray-500">
                     {approvedCount}/{khungCa.max_nv || 4} duyệt
                 </span>
                 <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${statusColor}`}>
                     {statusText}
                 </span>
            </div>
            
            <div className="space-y-2 flex-1">
                {cellData.map(reg => (
                    <div key={reg.id} className={`p-2 border rounded-lg text-sm ${getRegStatusStyle(reg.trang_thai)} flex flex-col transition-all shadow-sm`}>
                        <div className="flex justify-between items-start mb-1">
                            <Link 
                                to={`/ho-so/${reg.nhan_vien_id}`}
                                className="font-semibold truncate pr-1 hover:underline hover:text-primary-700 transition" 
                                title={`Xem hồ sơ của ${reg.ho_ten}`}
                            >
                                {reg.ho_ten}
                            </Link>
                            <span className="text-[10px] mt-0.5 px-1 rounded bg-black/5 shrink-0 uppercase tracking-tighter font-bold">
                                {reg.trang_thai === 'cho_duyet' ? 'Chờ' : reg.trang_thai === 'da_duyet' ? 'Duyệt' : 'Từ chối'}
                            </span>
                        </div>
                        <div className="flex gap-1 justify-end mt-1 pt-1 border-t border-black/5 opacity-80 hover:opacity-100">
                            {reg.trang_thai === 'cho_duyet' && !isHoanThanh && !isLocked && (
                                <>
                                    <button 
                                        onClick={() => handleDuyet(reg.id, 'da_duyet')}
                                        className="p-1 px-2 border border-green-300 rounded bg-white text-green-700 hover:bg-green-500 hover:text-white transition-colors flex-1 flex justify-center"
                                        title="Duyệt"
                                    ><CheckIcon className="w-4 h-4" /></button>
                                    <button 
                                        onClick={() => handleDuyet(reg.id, 'tu_choi')}
                                        className="p-1 px-2 border border-red-300 rounded bg-white text-red-700 hover:bg-red-500 hover:text-white transition-colors flex-1 flex justify-center"
                                        title="Từ chối"
                                    ><XMarkIcon className="w-4 h-4" /></button>
                                </>
                            )}
                            {reg.trang_thai !== 'cho_duyet' && !isHoanThanh && !isLocked && (
                                <button 
                                    onClick={() => handleDuyet(reg.id, 'cho_duyet')}
                                    className="p-1 px-2 border border-yellow-400 rounded bg-white text-yellow-700 hover:bg-yellow-500 hover:text-white transition-colors flex items-center gap-1 w-full justify-center text-xs font-medium"
                                    title="Bỏ duyệt"
                                ><ArrowUturnLeftIcon className="w-3.5 h-3.5" /> Bỏ duyệt</button>
                            )}
                            {isLocked && reg.trang_thai !== 'cho_duyet' && (
                                <div className="text-[10px] text-center w-full text-gray-500 italic py-1 bg-white/50 rounded">Đã chốt lịch</div>
                            )}
                        </div>
                    </div>
                ))}
                {cellData.length === 0 && (
                    <div className="flex items-center justify-center h-16 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/50">
                        <span className="text-xs text-gray-400 font-medium">Chưa có đăng ký</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShiftCard;
