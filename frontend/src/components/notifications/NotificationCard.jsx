import React from 'react';
import { 
    InformationCircleIcon, 
    ExclamationTriangleIcon, 
    BellAlertIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import { BookmarkIcon as BookmarkOutlineIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const NotificationCard = ({ notification, canPost, onTogglePin }) => {
    // Fallback an toàn cho dữ liệu
    const {
        id,
        tieu_de = 'Thông báo',
        noi_dung = 'Không có nội dung',
        muc_do = 'info',
        nguoi_tao_ten = 'Hệ thống',
        nguoi_tao_vai_tro = '',
        ngay_tao = null,
        is_pinned = false
    } = notification || {};

    const getMucDoStyle = (level) => {
        switch (level) {
            case 'urgent': 
                return { 
                    icon: <BellAlertIcon className="w-6 h-6 text-red-500" />, 
                    bg: 'bg-white', 
                    border: 'border-l-4 border-l-red-500 border-y-red-100 border-r-red-100', 
                    text: 'text-red-700',
                    badgeBg: 'bg-red-50 text-red-600 border-red-100'
                };
            case 'warning': 
                return { 
                    icon: <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500" />, 
                    bg: 'bg-white', 
                    border: 'border-l-4 border-l-yellow-500 border-y-yellow-100 border-r-yellow-100', 
                    text: 'text-yellow-700',
                    badgeBg: 'bg-yellow-50 text-yellow-700 border-yellow-100'
                };
            case 'info':
            default: 
                return { 
                    icon: <InformationCircleIcon className="w-6 h-6 text-blue-500" />, 
                    bg: 'bg-white', 
                    border: 'border-l-4 border-l-blue-500 border-y-blue-100 border-r-blue-100', 
                    text: 'text-blue-700',
                    badgeBg: 'bg-blue-50 text-blue-600 border-blue-100'
                };
        }
    };

    const style = getMucDoStyle(muc_do);

    return (
        <div className={`p-5 rounded-xl border shadow-sm flex gap-4 transition-all relative group hover:shadow-md ${style.bg} ${style.border} ${is_pinned ? 'ring-2 ring-primary-500/30 bg-primary-50/10' : ''}`}>
            
            {/* Badge Ghim nổi bật */}
            {is_pinned && (
                <div className="absolute top-0 right-8 -translate-y-1/2 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-[10px] px-3 py-1 rounded-full font-bold shadow-md uppercase tracking-wider flex items-center gap-1.5 border border-primary-400">
                    <BookmarkSolidIcon className="w-3 h-3" /> Đã ghim
                </div>
            )}

            <div className="shrink-0 pt-1 relative">
                <div className={`p-2 rounded-xl border ${style.badgeBg}`}>
                    {style.icon}
                </div>
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-4">
                    <h3 className={`text-lg font-bold mb-1.5 truncate ${style.text}`} title={tieu_de}>
                        {tieu_de}
                    </h3>
                    {canPost && (
                        <button 
                            onClick={() => onTogglePin(id)}
                            className={`p-1.5 rounded-lg transition-colors shrink-0 ${is_pinned ? 'text-primary-600 bg-primary-50 hover:bg-primary-100' : 'text-gray-400 hover:bg-gray-100 opacity-0 group-hover:opacity-100 focus:opacity-100'}`}
                            title={is_pinned ? "Bỏ ghim" : "Ghim lên đầu"}
                        >
                            {is_pinned ? <BookmarkSolidIcon className="w-5 h-5" /> : <BookmarkOutlineIcon className="w-5 h-5" />}
                        </button>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-3">
                    <span className="font-semibold text-gray-700 flex items-center gap-1">
                        {nguoi_tao_ten} 
                        {nguoi_tao_vai_tro && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 uppercase tracking-tighter border border-gray-200">
                                {nguoi_tao_vai_tro}
                            </span>
                        )}
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="flex items-center gap-1">
                        {ngay_tao ? formatDistanceToNow(new Date(ngay_tao), { addSuffix: true, locale: vi }) : 'Không rõ thời gian'}
                    </span>
                </div>
                
                <div className="text-gray-700 whitespace-pre-line text-sm leading-relaxed bg-gray-50/80 p-4 rounded-xl border border-gray-100">
                    {noi_dung}
                </div>
            </div>
        </div>
    );
};

export default NotificationCard;
