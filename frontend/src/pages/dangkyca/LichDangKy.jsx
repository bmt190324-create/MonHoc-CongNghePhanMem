import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';
import { ClockIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { format, differenceInSeconds } from 'date-fns';
import Badge from '../../components/common/Badge';

const daysOfWeek = [
    { index: 2, name: 'Thứ 2' }, { index: 3, name: 'Thứ 3' },
    { index: 4, name: 'Thứ 4' }, { index: 5, name: 'Thứ 5' },
    { index: 6, name: 'Thứ 6' }, { index: 7, name: 'Thứ 7' },
    { index: 8, name: 'Chủ nhật' }
];

const LichDangKy = () => {
    const [tuanList, setTuanList] = useState([]);
    const [selectedTuan, setSelectedTuan] = useState('');
    const [khungCaList, setKhungCaList] = useState([]);
    
    // { "2-1": true, "3-2": false } -> "thu_trong_tuan-khung_ca_id"
    const [selectedSlots, setSelectedSlots] = useState({});
    
    const [currentDangKy, setCurrentDangKy] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deadlineCountdown, setDeadlineCountdown] = useState(null);
    
    // Kiểm tra quy định đăng ký mới: Linh hoạt theo cài đặt của Chủ siêu thị
    const today = new Date();

    // 1. Lấy dữ liệu cơ bản
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [tuans, cas] = await Promise.all([
                    axiosClient.get('/tuan-lam-viec'),
                    axiosClient.get('/dang-ky-ca/khung-ca')
                ]);
                
                // --- LOGIC LỌC 3 TUẦN ---
                const now = new Date();
                const currentIdx = tuans.findIndex(t => {
                    const start = new Date(t.ngay_bat_dau);
                    const end = new Date(t.ngay_ket_thuc);
                    // Mở rộng biên độ một chút để đảm bảo bao phủ
                    return now >= start && now < new Date(end.getTime() + 24*60*60*1000);
                });

                let filtered = [];
                if (currentIdx !== -1) {
                    // Vì tuans là DESC: [Tuần_Sau, Tuần_Này, Tuần_Trước, ...]
                    if (currentIdx > 0) filtered.push({ ...tuans[currentIdx - 1], label: ' (Tuần tiếp theo)' });
                    filtered.push({ ...tuans[currentIdx], label: ' (Tuần hiện tại)' });
                } else {
                    // Nếu không tìm thấy, lấy 2 tuần mới nhất
                    filtered = tuans.slice(0, 2).map((t, i) => ({ ...t, label: i === 0 ? ' (Mới nhất)' : '' }));
                }
                
                setTuanList(filtered);
                setKhungCaList(cas);
                
                if (filtered.length > 0) {
                    const savedTuan = sessionStorage.getItem('last_tuan_dangky');
                    if (savedTuan && filtered.find(t => t.id.toString() === savedTuan)) {
                        setSelectedTuan(savedTuan);
                    } else {
                        // Ưu tiên chọn tuần 'Tuần tiếp theo' nếu có để nhân viên đăng ký
                        const nextTuan = filtered.find(t => t.label?.includes('Tuần tiếp theo')) 
                                       || filtered.find(t => t.label?.includes('Tuần hiện tại')) 
                                       || filtered[0];
                        setSelectedTuan(nextTuan.id.toString());
                    }
                }
            } catch (err) {
                toast.error('Lỗi khi tải thông tin cơ bản: ' + err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (selectedTuan) {
            sessionStorage.setItem('last_tuan_dangky', selectedTuan);
        }
    }, [selectedTuan]);

    // 2. Lấy dữ liệu đăng ký của tuần
    useEffect(() => {
        if (!selectedTuan) return;
        
        const fetchDangKy = async () => {
            setLoading(true);
            try {
                const res = await axiosClient.get(`/dang-ky-ca/cua-toi?tuan_id=${selectedTuan}`);
                setCurrentDangKy(res);
                
                // Map current dang ky to selectedSlots
                const newSlots = {};
                res.forEach(item => {
                    newSlots[`${item.thu_trong_tuan}-${item.khung_ca_id}`] = true;
                });
                setSelectedSlots(newSlots);
            } catch (err) {
                toast.error(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchDangKy();
    }, [selectedTuan]);

    // 3. Xử lý Countdown
    useEffect(() => {
        if (!selectedTuan) return;
        const tuan = tuanList.find(t => t.id.toString() === selectedTuan);
        if (!tuan) return;

        const deadline = new Date(tuan.deadline_dk);
        
        const timer = setInterval(() => {
            const now = new Date();
            const diff = differenceInSeconds(deadline, now);
            if (diff <= 0) {
                setDeadlineCountdown('Đã hết hạn');
                clearInterval(timer);
            } else {
                const d = Math.floor(diff / (3600*24));
                const h = Math.floor(diff % (3600*24) / 3600);
                const m = Math.floor(diff % 3600 / 60);
                const s = Math.floor(diff % 60);
                setDeadlineCountdown(`${d} ngày ${h}h ${m}p ${s}s`);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [selectedTuan, tuanList]);

    const handleToggleSlot = (thu, khungCaId) => {
        // Nếu đã hết hạn, không cho click
        if (deadlineCountdown === 'Đã hết hạn') {
            toast.error('Đã quá thời gian đăng ký cho tuần này');
            return;
        }

        // Check xem có phải ca đã được duyệt hay từ chối ko (không cho sửa)
        const currentItem = currentDangKy.find(i => i.thu_trong_tuan === thu && i.khung_ca_id === khungCaId);
        if (currentItem && currentItem.trang_thai !== 'cho_duyet') {
            toast.error(`Ca này ${currentItem.trang_thai === 'da_duyet' ? 'đã được duyệt' : 'đã bị từ chối'}, không thể thay đổi!`);
            return;
        }

        const key = `${thu}-${khungCaId}`;
        setSelectedSlots(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSubmit = async () => {
        if (!selectedTuan) return;
        if (deadlineCountdown === 'Đã hết hạn') {
            toast.error('Đã hết hạn đăng ký ca tuần này.');
            return;
        }

        const slotsToSubmit = [];
        Object.keys(selectedSlots).forEach(key => {
            if (selectedSlots[key]) {
                const [thu, caId] = key.split('-');
                slotsToSubmit.push({
                    thu_trong_tuan: parseInt(thu),
                    khung_ca_id: parseInt(caId)
                });
            }
        });

        if (slotsToSubmit.length === 0) {
             const ok = window.confirm("Bỏ chọn toàn bộ ca tuần này?");
             if (!ok) return;
        }

        setSaving(true);
        try {
            await axiosClient.post('/dang-ky-ca/batch', {
                tuan_id: selectedTuan,
                slots: slotsToSubmit
            });
            toast.success('Lưu đăng ký ca thành công!');
            // Re-fetch
            const res = await axiosClient.get(`/dang-ky-ca/cua-toi?tuan_id=${selectedTuan}`);
            setCurrentDangKy(res);
        } catch (err) {
            toast.error(err.message || 'Lỗi khi lưu đăng ký');
        } finally {
            setSaving(false);
        }
    };

    if (loading && tuanList.length === 0) return <div className="p-4 text-gray-500">Đang tải...</div>;

    if (tuanList.length === 0) return (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 text-center">
            <CalendarDaysIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-gray-900">Không có tuần làm việc nào đang mở</h2>
            <p className="text-gray-500 mt-1">Xin vui lòng quay lại sau khi Quản lý tạo lịch đăng ký mới.</p>
        </div>
    );

    const selectedTuanInfo = tuanList.find(t => t.id.toString() === selectedTuan);
    
    // Quy định: Tuần phải ở trạng thái 'mo', đúng ngày đăng ký và chưa quá giờ deadline
    const now = new Date();
    const todayOnlyDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const deadline = selectedTuanInfo ? new Date(selectedTuanInfo.deadline_dk) : null;
    const deadlineOnlyDate = deadline ? new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate()) : null;

    const isBeforeRegDay = deadlineOnlyDate && todayOnlyDate < deadlineOnlyDate;
    const isAfterRegDay = deadlineOnlyDate && todayOnlyDate > deadlineOnlyDate;
    const isRegDay = deadlineOnlyDate && todayOnlyDate.getTime() === deadlineOnlyDate.getTime();
    const isOverTimeToday = isRegDay && now > deadline;

    const isTuanOpen = selectedTuanInfo && selectedTuanInfo.trang_thai === 'mo';
    const isFutureWeek = selectedTuanInfo && new Date(selectedTuanInfo.ngay_bat_dau) > new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const canRegister = isTuanOpen && isRegDay && !isOverTimeToday && isFutureWeek;
    const isPastDeadline = !canRegister;
    const isCurrentOrPastWeek = selectedTuanInfo && new Date(selectedTuanInfo.ngay_bat_dau) <= new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Đăng ký ca làm việc</h1>
                    <p className="mt-1 text-sm text-gray-500">Đăng ký nguyện vọng làm việc hàng tuần.</p>
                </div>
                
                <div className="flex gap-4 items-center">
                    <div>
                        <select 
                            value={selectedTuan} 
                            onChange={e => setSelectedTuan(e.target.value)}
                            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md shadow-sm border"
                        >
                            {tuanList.map(t => (
                                <option key={t.id} value={t.id}>
                                    Tuần {format(new Date(t.ngay_bat_dau), 'dd/MM')} - {format(new Date(t.ngay_ket_thuc), 'dd/MM/yyyy')}{t.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Cảnh báo quy định đăng ký */}
            {!canRegister && (
                <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg shadow-sm">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <ClockIcon className="h-5 w-5 text-amber-400" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-amber-700">
                                <strong>Thông báo:</strong> 
                                {isCurrentOrPastWeek 
                                    ? " Bạn không thể đăng ký hoặc chỉnh sửa ca cho tuần hiện tại hoặc đã qua."
                                    : !isTuanOpen 
                                        ? ` Tuần này hiện đang ${selectedTuanInfo?.trang_thai === 'khoa' ? 'bị khóa' : 'đã hoàn thành'}.`
                                        : isBeforeRegDay
                                            ? ` Chưa đến ngày đăng ký ca cho tuần sau (Ngày quy định: ${format(deadline, 'dd/MM/yyyy')}).`
                                            : isAfterRegDay
                                                ? ` Đã quá ngày đăng ký ca quy định cho tuần này (${format(deadline, 'dd/MM/yyyy')}).`
                                                : isOverTimeToday
                                                    ? " Đã quá thời hạn đăng ký (giờ deadline) trong ngày hôm nay."
                                                    : " Việc đăng ký ca hiện tại không được phép."}
                                <br />
                                <span className="text-xs italic mt-1 block">Vui lòng liên hệ Chủ siêu thị nếu bạn cần hỗ trợ thêm về lịch làm việc.</span>
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="p-3 w-[150px] border-r border-gray-200 text-center font-medium text-gray-700">Ca \ Thứ</th>
                                {daysOfWeek.map(day => (
                                    <th key={day.index} className="p-3 border-r border-gray-200 text-center font-medium text-gray-700">
                                        {day.name}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {khungCaList.map((ca, idx) => (
                                <tr key={ca.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                                    <td className="p-4 border-r border-b border-gray-200 text-center relative font-medium text-primary-900 bg-primary-50/30">
                                        {ca.ten_ca}<br/>
                                        <span className="text-xs text-gray-500 font-normal">{ca.gio_bat_dau.slice(0,5)} - {ca.gio_ket_thuc.slice(0,5)}</span>
                                    </td>
                                    {daysOfWeek.map(day => {
                                        const key = `${day.index}-${ca.id}`;
                                        const isSelected = !!selectedSlots[key];
                                        
                                        // Kiểm tra trạng thái hiện tại (nếu đã lưu)
                                        const savedItem = currentDangKy.find(i => i.thu_trong_tuan === day.index && i.khung_ca_id === ca.id);
                                        const isLocked = savedItem && savedItem.trang_thai !== 'cho_duyet';
                                        
                                        return (
                                            <td key={day.index} className="p-2 border-r border-b border-gray-200 text-center relative hover:bg-blue-50/30 transition-colors">
                                                <button
                                                    onClick={() => handleToggleSlot(day.index, ca.id)}
                                                    disabled={isPastDeadline || isLocked}
                                                    className={`w-full h-16 min-h-[64px] rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-1
                                                        ${isSelected 
                                                            ? 'border-primary-500 bg-primary-50 text-primary-700' 
                                                            : 'border-transparent bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600'}
                                                        ${isPastDeadline ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                                        ${isLocked ? 'cursor-not-allowed opacity-90' : ''}
                                                    `}
                                                >
                                                    {isSelected ? 'Đã chọn' : '+'}
                                                    {savedItem && <Badge status={savedItem.trang_thai} />}
                                                </button>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200 mt-4">
                 <button
                    onClick={handleSubmit}
                    disabled={isPastDeadline || saving}
                    className="inline-flex items-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                    {saving ? 'Đang lưu...' : 'Lưu Đăng Ký'}
                </button>
            </div>
            
            <div className="text-sm text-gray-500">
                <p><strong>Lưu ý:</strong> Bạn chỉ có thể sửa đổi đăng ký trước thời hạn và khi ca chưa được quản lý duyệt/từ chối.</p>
            </div>
        </div>
    );
};

export default LichDangKy;
