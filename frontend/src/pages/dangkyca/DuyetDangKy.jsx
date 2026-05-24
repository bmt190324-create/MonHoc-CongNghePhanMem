import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../hooks/useAuth';

import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { CheckIcon, XMarkIcon, ArrowUturnLeftIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';
import WeeklySchedule from '../../components/schedule/WeeklySchedule';

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

                <WeeklySchedule 
                    khungCaList={khungCaList} 
                    danhSach={danhSach} 
                    isLocked={isLocked}
                    handleUpdateKhungCa={handleUpdateKhungCa}
                    handleDuyet={handleDuyet}
                    selectedTuanInfo={selectedTuanInfo}
                    loading={loading}
                />
            
        </div>
    );
};

export default DuyetDangKy;
