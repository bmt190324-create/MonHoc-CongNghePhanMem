import React, { useState, useEffect, useMemo } from 'react';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { BoltIcon, UserPlusIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const DAYS = [
    { value: 2, label: 'Thứ 2' },
    { value: 3, label: 'Thứ 3' },
    { value: 4, label: 'Thứ 4' },
    { value: 5, label: 'Thứ 5' },
    { value: 6, label: 'Thứ 6' },
    { value: 7, label: 'Thứ 7' },
    { value: 8, label: 'Chủ nhật' }
];

const TaoLichLamViec = () => {
    const [tuanList, setTuanList] = useState([]);
    const [selectedTuan, setSelectedTuan] = useState('');
    const [khungCaList, setKhungCaList] = useState([]);
    const [lichList, setLichList] = useState([]);  // LichLamViec records
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [assigningId, setAssigningId] = useState(null); // lich_id đang phân công

    // Fetch danh sách tuần và khung ca
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [tuans, khungCas] = await Promise.all([
                    axiosClient.get('/tuan-lam-viec'),
                    axiosClient.get('/dang-ky-ca/khung-ca')
                ]);
                setTuanList(tuans);
                setKhungCaList(khungCas);
                if (tuans.length > 0) setSelectedTuan(tuans[0].id.toString());
            } catch (err) {
                toast.error(err.message);
            }
        };
        fetchData();
    }, []);

    // Fetch lịch làm việc của tuần đã chọn
    const fetchLich = async () => {
        if (!selectedTuan) return;
        setLoading(true);
        try {
            const data = await axiosClient.get(`/lich-lam-viec?tuan_id=${selectedTuan}`);
            setLichList(data);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLich();
    }, [selectedTuan]);

    // Tạo lịch tự động từ đăng ký đã duyệt
    const handleTaoLich = async () => {
        if (!selectedTuan) return;
        setGenerating(true);
        try {
            const res = await axiosClient.post('/lich-lam-viec/tao-tu-dang-ky', { tuan_id: selectedTuan });
            toast.success(res.message || 'Tạo lịch thành công');
            fetchLich();
        } catch (err) {
            toast.error(err.message || 'Lỗi tạo lịch');
        } finally {
            setGenerating(false);
        }
    };

    // Bố trí NV tự động cho một ô lịch cụ thể
    const handleAutoAssign = async (lichId) => {
        setAssigningId(lichId);
        try {
            const res = await axiosClient.post('/phan-cong-ca/tu-dang-ky', { lich_id: lichId });
            toast.success(res.message);
            fetchLich();
        } catch (err) {
            toast.error(err.message || 'Lỗi khi phân công');
        } finally {
            setAssigningId(null);
        }
    };

    // Tạo map từ {khung_ca_id}-{thu_trong_tuan} => LichLamViec record
    const lichMap = useMemo(() => {
        const map = {};
        lichList.forEach(l => {
            map[`${l.khung_ca_id}-${l.thu_trong_tuan}`] = l;
        });
        return map;
    }, [lichList]);

    const totalPhanCong = lichList.reduce((sum, l) => sum + parseInt(l.so_nv_phan_cong || 0), 0);
    const totalLich = lichList.length;

    return (
        <div className="space-y-6 flex flex-col h-[calc(100vh-6rem)]">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Tạo Lịch Làm Việc</h1>
                    <p className="mt-1 text-sm text-gray-500">Xem dạng lưới và phân công nhân viên vào từng ca.</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={selectedTuan}
                        onChange={e => setSelectedTuan(e.target.value)}
                        className="block w-52 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-lg shadow-sm border"
                    >
                        <option value="">Chọn tuần...</option>
                        {tuanList.map(t => (
                            <option key={t.id} value={t.id}>
                                Tuần {format(new Date(t.ngay_bat_dau), 'dd/MM')} - {format(new Date(t.ngay_ket_thuc), 'dd/MM/yyyy')}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={handleTaoLich}
                        disabled={generating || !selectedTuan}
                        className="inline-flex items-center justify-center bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors shadow-sm font-medium disabled:bg-primary-300 whitespace-nowrap"
                    >
                        <BoltIcon className="w-5 h-5 mr-2" />
                        {generating ? 'Đang tạo...' : 'Tạo Lịch Tự Động'}
                    </button>
                </div>
            </div>

            {/* Stats bar */}
            {totalLich > 0 && (
                <div className="flex gap-4 shrink-0">
                    <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium">
                        <CheckCircleIcon className="w-4 h-4" />
                        {totalLich} ca đã tạo lịch
                    </div>
                    <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-sm font-medium">
                        <UserPlusIcon className="w-4 h-4" />
                        {totalPhanCong} lượt phân công
                    </div>
                </div>
            )}

            {/* Ma trận lưới */}
            <div className="flex-1 overflow-auto bg-white rounded-xl shadow-sm border border-gray-200 relative">
                {loading && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-sm z-10">
                        <div className="animate-pulse flex flex-col items-center">
                            <div className="h-10 w-10 bg-primary-200 rounded-full mb-3"></div>
                            <span className="text-gray-500 font-medium">Đang tải lịch...</span>
                        </div>
                    </div>
                )}

                <div className="min-w-[1000px]">
                    {/* Header hàng: Ca \ Thứ */}
                    <div className="grid grid-cols-8 border-b border-gray-200 bg-gray-50 sticky top-0 z-20">
                        <div className="p-4 font-semibold text-gray-600 border-r border-gray-200 text-center">Ca \ Thứ</div>
                        {DAYS.map(day => (
                            <div key={day.value} className="p-4 text-center font-semibold text-gray-700 border-r border-gray-200 last:border-0">
                                {day.label}
                            </div>
                        ))}
                    </div>

                    {/* Rows theo từng khung ca */}
                    <div className="divide-y divide-gray-200">
                        {khungCaList.length === 0 && !loading && (
                            <div className="col-span-8 text-center text-gray-400 py-16 text-sm italic">
                                Không có khung ca nào được cấu hình
                            </div>
                        )}
                        {khungCaList.map((kc, index) => (
                            <div key={kc.id} className={`grid grid-cols-8 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                {/* Cột tên ca - sticky bên trái */}
                                <div className="p-3 border-r border-gray-200 flex flex-col justify-center items-center bg-white sticky left-0 z-10 shadow-[1px_0_4px_rgba(0,0,0,0.05)]">
                                    <span className="font-bold text-gray-800 bg-indigo-50 px-2 py-1 rounded text-sm mb-1">{kc.ten_ca}</span>
                                    <span className="text-xs text-gray-500 font-medium">{kc.gio_bat_dau.slice(0, 5)} - {kc.gio_ket_thuc.slice(0, 5)}</span>
                                </div>

                                {/* Mỗi ô là một ngày trong tuần */}
                                {DAYS.map(day => {
                                    const cellKey = `${kc.id}-${day.value}`;
                                    const lich = lichMap[cellKey];
                                    const isWeekend = day.value === 7 || day.value === 8;
                                    const soNV = lich ? parseInt(lich.so_nv_phan_cong || 0) : 0;
                                    const isAssigning = assigningId === lich?.id;

                                    return (
                                        <div key={day.value} className={`p-2 border-r border-gray-200 last:border-0 min-h-[120px] flex flex-col ${isWeekend ? 'bg-amber-50/20' : ''}`}>
                                            {lich ? (
                                                <>
                                                    {/* Ngày làm */}
                                                    <div className="text-[10px] text-gray-500 font-semibold text-center mb-2 bg-gray-100 rounded px-1 py-0.5">
                                                        {format(new Date(lich.ngay_lam), 'dd/MM/yyyy')}
                                                    </div>

                                                    {/* Số NV đã phân công */}
                                                    <div className="flex-1 flex flex-col items-center justify-center">
                                                        <div className={`text-2xl font-bold mb-0.5 ${soNV > 0 ? 'text-indigo-600' : 'text-gray-300'}`}>
                                                            {soNV}
                                                        </div>
                                                        <div className="text-[10px] text-gray-400 font-medium">/ 4 nhân viên</div>

                                                        {/* Bar progress */}
                                                        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2 mb-1">
                                                            <div
                                                                className={`h-1.5 rounded-full transition-all ${soNV >= 4 ? 'bg-green-500' : soNV > 0 ? 'bg-indigo-400' : 'bg-gray-200'}`}
                                                                style={{ width: `${Math.min((soNV / 4) * 100, 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Nút bố trí */}
                                                    <button
                                                        onClick={() => handleAutoAssign(lich.id)}
                                                        disabled={isAssigning}
                                                        className="mt-1 w-full flex items-center justify-center gap-1 px-2 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-[11px] font-medium transition-colors disabled:opacity-50"
                                                        title="Bố trí NV từ đăng ký đã duyệt"
                                                    >
                                                        <UserPlusIcon className="w-3.5 h-3.5" />
                                                        {isAssigning ? 'Đang bố trí...' : 'Bố trí NV'}
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="flex-1 flex items-center justify-center">
                                                    <span className="text-xs text-gray-300 italic">Chưa có lịch</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Empty state khi chưa tạo lịch */}
            {!loading && lichList.length === 0 && khungCaList.length > 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {/* Chỉ hiện overlay khi grid đã render */}
                </div>
            )}
        </div>
    );
};

export default TaoLichLamViec;
