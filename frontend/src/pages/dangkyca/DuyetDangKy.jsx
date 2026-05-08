import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../hooks/useAuth';

import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { CheckIcon, XMarkIcon, ArrowUturnLeftIcon, CalendarIcon, ClockIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

const DAYS = [
    { value: 2, label: 'Thứ 2' },
    { value: 3, label: 'Thứ 3' },
    { value: 4, label: 'Thứ 4' },
    { value: 5, label: 'Thứ 5' },
    { value: 6, label: 'Thứ 6' },
    { value: 7, label: 'Thứ 7' },
    { value: 8, label: 'Chủ nhật' }
];

const DuyetDangKy = () => {
    const { user } = useAuth();
    const [tuanList, setTuanList] = useState([]);
    const [selectedTuan, setSelectedTuan] = useState('');
    const [khungCaList, setKhungCaList] = useState([]);
    const [danhSach, setDanhSach] = useState([]);
    const [loading, setLoading] = useState(true);
    const selectedTuanInfo = useMemo(() => tuanList.find(t => t.id.toString() === selectedTuan), [tuanList, selectedTuan]);

    const isLocked = useMemo(() => {
        if (!selectedTuanInfo?.deadline_dk) return false;
        const now = new Date();
        now.setHours(0,0,0,0);
        const deadline = new Date(selectedTuanInfo.deadline_dk);
        deadline.setHours(0,0,0,0);
        const lockDate = new Date(deadline);
        lockDate.setDate(lockDate.getDate() + 1); // Khóa ngay sau ngày deadline 1 ngày
        return now > lockDate;
    }, [selectedTuanInfo]);

    const fetchData = async () => {
        try {
            const [tuans, khungCas] = await Promise.all([
                axiosClient.get('/tuan-lam-viec'),
                axiosClient.get('/dang-ky-ca/khung-ca')
            ]);
            
            // --- LOGIC LỌC 3 TUẦN ---
            const now = new Date();
            const currentIdx = tuans.findIndex(t => {
                const start = new Date(t.ngay_bat_dau);
                const end = new Date(t.ngay_ket_thuc);
                return now >= start && now < new Date(end.getTime() + 24*60*60*1000);
            });

            let filtered = [];
            if (currentIdx !== -1) {
                if (currentIdx > 0) filtered.push({ ...tuans[currentIdx - 1], label: ' (Tuần tiếp theo)' });
                filtered.push({ ...tuans[currentIdx], label: ' (Tuần hiện tại)' });
            } else {
                filtered = tuans.slice(0, 2).map((t, i) => ({ ...t, label: i === 0 ? ' (Mới nhất)' : '' }));
            }

            setTuanList(filtered);
            setKhungCaList(khungCas);
            
            if (filtered.length > 0) {
                const savedTuan = sessionStorage.getItem('last_tuan_duyet');
                if (savedTuan && filtered.find(t => t.id.toString() === savedTuan)) {
                    setSelectedTuan(savedTuan);
                } else {
                    // Ưu tiên tuần 'Tuần tiếp theo' hoặc 'Tuần hiện tại'
                    const initialTuan = filtered.find(t => t.label?.includes('Tuần tiếp theo'))
                                       || filtered.find(t => t.label?.includes('Tuần hiện tại'))
                                       || filtered[0];
                    setSelectedTuan(initialTuan.id.toString());
                }
            }
        } catch (err) {
            toast.error(err.message);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedTuan) {
            sessionStorage.setItem('last_tuan_duyet', selectedTuan);
        }
    }, [selectedTuan]);

    const fetchDanhSach = async () => {
        if (!selectedTuan) return;
        setLoading(true);
        try {
            // Backend API đã được cập nhật để mặc định trả về TẤT CẢ trạng thái nếu không truyền ?trang_thai
            const data = await axiosClient.get(`/dang-ky-ca/cho-duyet?tuan_id=${selectedTuan}`);
            setDanhSach(data);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDanhSach();
    }, [selectedTuan]);

    const currentTuan = tuanList.find(t => t.label?.includes('Tuần hiện tại'));
    const nextTuan = tuanList.find(t => t.label?.includes('Tuần tiếp theo'));
    const isSelectedCurrent = selectedTuan === currentTuan?.id.toString();

    const handleSetRegistrationDay = async (dayIndex) => {
        if (!nextTuan || !currentTuan) {
            toast.error('Không tìm thấy đủ dữ liệu vòng đời tuần để cài đặt.');
            return;
        }

        // Tính ngày cụ thể của tuần HIỆN TẠI dựa trên dayIndex
        const startOfCurrent = new Date(currentTuan.ngay_bat_dau);
        const targetDay = new Date(startOfCurrent);
        targetDay.setDate(startOfCurrent.getDate() + (dayIndex - 2));
        targetDay.setHours(23, 59, 59, 999);
        try {
            await axiosClient.put(`/tuan-lam-viec/${nextTuan.id}/deadline`, { 
                deadline_dk: targetDay.toISOString() 
            });
            toast.success(`Thành công! Nhân viên chỉ có thể đăng ký ca tuần sau vào ${DAYS.find(d => d.value === dayIndex).label} tuần này.`);
            fetchData();
        } catch (err) {
            toast.error('Lỗi khi cài đặt hạn đăng ký: ' + err.message);
        }
    };

    const handleUpdateKhungCa = async (id, min_nv, max_nv) => {
        try {
            await axiosClient.put(`/dang-ky-ca/khung-ca/${id}`, { min_nv, max_nv });
            toast.success('Đã cập nhật giới hạn nhân sự cho ca');
            // Reload khung ca list
            const res = await axiosClient.get('/dang-ky-ca/khung-ca');
            setKhungCaList(res);
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleDuyet = async (id, trang_thai) => {
        try {
            const res = await axiosClient.put(`/dang-ky-ca/${id}/duyet`, { trang_thai });
            if (res.warning) toast(res.warning, { icon: '⚠️', duration: 4000 });
            else toast.success('Đã cập nhật trạng thái');
            fetchDanhSach(); // Refresh matrix
        } catch (err) {
            toast.error(err.message);
        }
    };

    // Grouping registrations by {khung_ca_id}-{thu_trong_tuan}
    const groupedData = useMemo(() => {
        const group = {};
        danhSach.forEach(item => {
            const key = `${item.khung_ca_id}-${item.thu_trong_tuan}`;
            if (!group[key]) group[key] = [];
            group[key].push(item);
        });
        return group;
    }, [danhSach]);

    const getStatusStyle = (trang_thai) => {
        if (trang_thai === 'da_duyet') return 'bg-green-50 border-green-200 text-green-800';
        if (trang_thai === 'tu_choi') return 'bg-red-50 border-red-200 text-red-800 opacity-60';
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'; // cho_duyet
    };

    return (
        <div className="space-y-6 flex flex-col h-[calc(100vh-6rem)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Duyệt Đăng Ký Ca</h1>
                    <p className="mt-1 text-sm text-gray-500">Xem dạng lưới tổng thể nhân sự đăng ký và phê duyệt.</p>
                </div>
                <div>
                     <select 
                        value={selectedTuan} 
                        onChange={e => setSelectedTuan(e.target.value)}
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-lg shadow-sm border"
                    >
                        <option value="">Chọn tuần...</option>
                        {tuanList.map(t => (
                            <option key={t.id} value={t.id}>
                                Tuần {format(new Date(t.ngay_bat_dau), 'dd/MM')} - {format(new Date(t.ngay_ket_thuc), 'dd/MM/yyyy')}{t.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Cài đặt ngày đăng ký cho tuần sau (Chỉ hiện ở tuần hiện tại) */}
            {isSelectedCurrent && nextTuan && (
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm animate-in slide-in-from-top-4 duration-500 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100">
                            <CalendarIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-extrabold text-indigo-900 text-base">Thiết lập ngày nhân viên Đăng ký ca</p>
                            <p className="text-xs text-indigo-700 font-medium opacity-80">Chọn 1 ngày trong tuần này để nhân viên thực hiện đăng ký cho tuần sau ({format(new Date(nextTuan.ngay_bat_dau), 'dd/MM')} - {format(new Date(nextTuan.ngay_ket_thuc), 'dd/MM')})</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap justify-center gap-1.5">
                        {DAYS.map(day => {
                            const deadlineDate = nextTuan.deadline_dk ? new Date(nextTuan.deadline_dk).toLocaleDateString('vi-VN') : '';
                            const startOfCur = new Date(currentTuan.ngay_bat_dau);
                            const thisDay = new Date(startOfCur);
                            thisDay.setDate(startOfCur.getDate() + (day.value - 2));
                            const isSelected = deadlineDate === thisDay.toLocaleDateString('vi-VN');

                            return (
                                <button
                                    key={day.value}
                                    onClick={() => handleSetRegistrationDay(day.value)}
                                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm border
                                        ${isSelected 
                                            ? 'bg-indigo-600 text-white border-indigo-600 scale-105' 
                                            : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-100'}`}
                                >
                                    {day.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Thông tin deadline hiện tại nếu xem tuần khác */}
            {!isSelectedCurrent && selectedTuanInfo && (
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 bg-gray-50 self-start px-3 py-1.5 rounded-full border border-gray-200 shrink-0">
                    <ClockIcon className="w-4 h-4" />
                    Hạn đăng ký tuần này: {format(new Date(selectedTuanInfo.deadline_dk), 'HH:mm - dd/MM/yyyy')}
                </div>
            )}

            <div className="flex-1 overflow-auto bg-white rounded-xl shadow-sm border border-gray-200 relative">
                {loading ? (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-sm z-10">
                        <div className="animate-pulse flex flex-col items-center">
                            <div className="h-10 w-10 bg-primary-200 rounded-full mb-3"></div>
                            <span className="text-gray-500 font-medium">Đang tải ma trận...</span>
                        </div>
                    </div>
                ) : null}

                <div className="min-w-[1000px]">
                    <div className="grid grid-cols-8 border-b border-gray-200 bg-gray-50 sticky top-0 z-20">
                        <div className="p-4 font-semibold text-gray-600 border-r border-gray-200 text-center">Ca \ Thứ</div>
                        {DAYS.map(day => (
                            <div key={day.value} className="p-4 text-center font-semibold text-gray-700 border-r border-gray-200 last:border-0">
                                {day.label}
                            </div>
                        ))}
                    </div>

                    <div className="divide-y divide-gray-200">
                        {khungCaList.map((kc, index) => (
                            <div key={kc.id} className={`grid grid-cols-8 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                <div className="p-3 border-r border-gray-200 flex flex-col justify-center items-center bg-white sticky left-0 z-10 shadow-[1px_0_4px_rgba(0,0,0,0.05)]">
                                    <span className="font-bold text-gray-800 bg-indigo-50 px-2.5 py-1 rounded-lg text-sm mb-1">{kc.ten_ca}</span>
                                    <span className="text-[10px] text-gray-400 font-medium mb-2">{kc.gio_bat_dau.slice(0,5)} - {kc.gio_ket_thuc.slice(0,5)}</span>
                                    
                                    <div className="flex flex-col gap-1 w-full px-1">
                                        {/* Min NV Control */}
                                        <div className="flex items-center justify-between text-[9px] px-1.5 py-1 rounded bg-gray-50 border border-gray-100">
                                            <span className="text-gray-400">Min:</span>
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-bold text-indigo-600 min-w-[12px] text-center">{kc.min_nv || 2}</span>
                                                {(user?.vaiTro === 'CST' || user?.vaiTro === 'QLC') && !isLocked && (
                                                    <div className="flex flex-col -gap-0.5">
                                                        <button 
                                                            onClick={() => handleUpdateKhungCa(kc.id, (kc.min_nv || 2) + 1, kc.max_nv)}
                                                            className="hover:text-indigo-600 transition-colors"
                                                        >
                                                            <ChevronUpIcon className="w-2.5 h-2.5" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleUpdateKhungCa(kc.id, Math.max(0, (kc.min_nv || 2) - 1), kc.max_nv)}
                                                            className="hover:text-indigo-600 transition-colors"
                                                        >
                                                            <ChevronDownIcon className="w-2.5 h-2.5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Max NV Control */}
                                        <div className="flex items-center justify-between text-[9px] px-1.5 py-1 rounded bg-gray-50 border border-gray-100">
                                            <span className="text-gray-400">Max:</span>
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-bold text-red-600 min-w-[12px] text-center">{kc.max_nv || 4}</span>
                                                {(user?.vaiTro === 'CST' || user?.vaiTro === 'QLC') && !isLocked && (
                                                    <div className="flex flex-col -gap-0.5">
                                                        <button 
                                                            onClick={() => handleUpdateKhungCa(kc.id, kc.min_nv, (kc.max_nv || 4) + 1)}
                                                            className="hover:text-red-600 transition-colors"
                                                        >
                                                            <ChevronUpIcon className="w-2.5 h-2.5" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleUpdateKhungCa(kc.id, kc.min_nv, Math.max(kc.min_nv || 0, (kc.max_nv || 4) - 1))}
                                                            className="hover:text-red-600 transition-colors"
                                                        >
                                                            <ChevronDownIcon className="w-2.5 h-2.5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {DAYS.map(day => {
                                    const cellKey = `${kc.id}-${day.value}`;
                                    const cellData = groupedData[cellKey] || [];
                                    const isWeekend = day.value === 7 || day.value === 8;
                                    
                                    return (
                                        <div key={day.value} className={`p-2 border-r border-gray-200 last:border-0 min-h-[120px] ${isWeekend ? 'bg-gray-50/30' : ''}`}>
                                            <div className="flex justify-between items-center mb-2 px-1">
                                                 <span className="text-[10px] text-gray-400 font-medium uppercase">
                                                     {cellData.length}/4 người
                                                 </span>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                {cellData.map(reg => (
                                                    <div key={reg.id} className={`p-2 border rounded-md text-sm ${getStatusStyle(reg.trang_thai)} flex flex-col transition-all cursor-default`}>
                                                        <div className="flex justify-between items-start mb-1 h-full">
                                                            <Link 
                                                                to={`/ho-so/${reg.nhan_vien_id}`}
                                                                className="font-semibold truncate pr-1 hover:underline hover:text-primary-700 transition" 
                                                                title={`Xem hồ sơ của ${reg.ho_ten}`}
                                                            >
                                                                {reg.ho_ten}
                                                            </Link>
                                                            <span className="text-[10px] mt-0.5 px-1 rounded bg-black/5 shrink-0">
                                                                {reg.trang_thai === 'cho_duyet' ? 'Chờ' : reg.trang_thai === 'da_duyet' ? 'Đã duyệt' : 'Từ chối'}
                                                            </span>
                                                        </div>
                                                        <div className="flex gap-1 justify-end mt-1 pt-1 border-t border-black/5 opacity-80 hover:opacity-100">
                                                        {reg.trang_thai === 'cho_duyet' && (selectedTuanInfo?.trang_thai !== 'hoan_thanh') && !isLocked && (
                                                                <>
                                                                    <button 
                                                                        onClick={() => handleDuyet(reg.id, 'da_duyet')}
                                                                        className="p-1 px-2 border border-green-300 rounded bg-white text-green-700 hover:bg-green-500 hover:text-white transition-colors"
                                                                        title="Duyệt"
                                                                    ><CheckIcon className="w-3.5 h-3.5" /></button>
                                                                    <button 
                                                                        onClick={() => handleDuyet(reg.id, 'tu_choi')}
                                                                        className="p-1 px-2 border border-red-300 rounded bg-white text-red-700 hover:bg-red-500 hover:text-white transition-colors"
                                                                        title="Từ chối"
                                                                    ><XMarkIcon className="w-3.5 h-3.5" /></button>
                                                                </>
                                                            )}
                                                            {reg.trang_thai !== 'cho_duyet' && (selectedTuanInfo?.trang_thai !== 'hoan_thanh') && !isLocked && (
                                                                <button 
                                                                    onClick={() => handleDuyet(reg.id, 'cho_duyet')}
                                                                    className="p-1 px-2 border border-yellow-400 rounded bg-white text-yellow-700 hover:bg-yellow-500 hover:text-white transition-colors flex items-center gap-1 w-full justify-center text-xs"
                                                                    title="Bỏ duyệt"
                                                                ><ArrowUturnLeftIcon className="w-3.5 h-3.5" /> Bỏ duyệt</button>
                                                            )}
                                                            {isLocked && reg.trang_thai !== 'cho_duyet' && (
                                                                <div className="text-[10px] text-center w-full text-gray-400 italic py-1 border border-gray-100 rounded bg-gray-50/50">Đã chốt lịch</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                                {cellData.length === 0 && (
                                                    <div className="text-xs text-gray-300 italic text-center pt-4">Trống</div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
        </div>
    );
};

export default DuyetDangKy;
