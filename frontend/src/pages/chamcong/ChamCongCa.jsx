import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const ChamCongCa = () => {
    const [tuanList, setTuanList] = useState([]);
    const [selectedTuan, setSelectedTuan] = useState('');
    const [lichList, setLichList] = useState([]);
    const [selectedLich, setSelectedLich] = useState('');
    const [chamCong, setChamCong] = useState([]);
    const [loading, setLoading] = useState(false);
    const selectedTuanInfo = React.useMemo(() => tuanList.find(t => t.id.toString() === selectedTuan), [tuanList, selectedTuan]);

    useEffect(() => {
        const fetchTuan = async () => {
            const tuans = await axiosClient.get('/tuan-lam-viec');
            
            // Lọc: Chỉ hiện tuần hiện tại và tuần sau
            const now = new Date();
            const currentIdx = tuans.findIndex(t => {
                const start = new Date(t.ngay_bat_dau);
                const end = new Date(t.ngay_ket_thuc);
                return now >= start && now < new Date(end.getTime() + 24*60*60*1000);
            });

            let filtered = [];
            if (currentIdx !== -1) {
                filtered.push(tuans[currentIdx]); // Hiện tại
                if (currentIdx > 0) filtered.unshift(tuans[currentIdx - 1]); // Sau (Dựa trên Order DESC của API)
            } else {
                filtered = tuans.slice(0, 2);
            }
            
            setTuanList(filtered);
            if (filtered.length > 0) {
                const savedTuan = sessionStorage.getItem('last_tuan_chamcong');
                if (savedTuan && filtered.find(t => t.id.toString() === savedTuan)) {
                    setSelectedTuan(savedTuan);
                } else {
                    // Mặc định chọn tuần hiện tại (thường là cái cuối trong mảng 2 phần tử nếu sắp xếp DESC)
                    const currentTuan = filtered.find(t => {
                         const start = new Date(t.ngay_bat_dau);
                         const end = new Date(t.ngay_ket_thuc);
                         return now >= start && now < new Date(end.getTime() + 24*60*60*1000);
                    }) || filtered[0];
                    setSelectedTuan(currentTuan.id.toString());
                }
            }
        };
        fetchTuan();
    }, []);

    useEffect(() => {
        if (selectedTuan) {
            sessionStorage.setItem('last_tuan_chamcong', selectedTuan);
        }
    }, [selectedTuan]);

    useEffect(() => {
        if (!selectedTuan) {
            setLichList([]);
            setSelectedLich('');
            return;
        }
        const fetchLich = async () => {
            const lich = await axiosClient.get(`/lich-lam-viec?tuan_id=${selectedTuan}`);
            setLichList(lich);
            if (lich.length > 0) setSelectedLich(lich[0].id.toString());
            else setSelectedLich('');
        };
        fetchLich();
    }, [selectedTuan]);

    const loadChamCong = async () => {
        if (!selectedLich) {
            setChamCong([]);
            return;
        }
        setLoading(true);
        try {
            const data = await axiosClient.get(`/cham-cong/theo-ca/${selectedLich}`);
            setChamCong(data);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadChamCong();
    }, [selectedLich]);

    const handleSave = async (id, gioVao, gioRa) => {
        try {
            // Chuẩn hóa định dạng giờ ra ISO nếu có giá trị. Nếu rỗng thì null
            const formatTime = (timeStr) => {
                if (!timeStr) return null;
                // Giả định ngày làm việc lấy từ ca
                const ca = lichList.find(l => l.id.toString() === selectedLich);
                const d = new Date(ca.ngay_lam);
                const [h, m] = timeStr.split(':');
                d.setHours(h, m, 0, 0);
                return d.toISOString();
            };

            const payload = {
                gio_vao: formatTime(gioVao),
                gio_ra: formatTime(gioRa)
            };

            await axiosClient.put(`/cham-cong/${id}`, payload);
            toast.success('Đã cập nhật chấm công');
            loadChamCong(); // load lại để DB chạy Trigger tính `trang_thai`, `so_phut_tre`
        } catch (err) {
            toast.error(err.message);
        }
    };

    const TimeSelect = ({ value, onChange, disabled }) => {
        const [isOpen, setIsOpen] = useState(false);
        const date = value ? new Date(value) : null;
        const currentH = date ? format(date, 'HH') : '00';
        const currentM = date ? format(date, 'mm') : '00';

        const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
        const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

        const handleHClick = (h) => {
            onChange(`${h}:${currentM}`);
        };
        const handleMClick = (m) => {
            onChange(`${currentH}:${m}`);
        };

        return (
            <div className="relative inline-block">
                <button
                    type="button"
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    disabled={disabled}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-primary-500 transition-all font-mono text-sm disabled:bg-gray-50 disabled:text-gray-400 min-w-[90px] justify-center"
                >
                    <span className="font-bold text-gray-800">{currentH}</span>
                    <span className="text-gray-400">:</span>
                    <span className="font-bold text-gray-800">{currentM}</span>
                </button>

                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
                        <div className="absolute top-full left-0 mt-2 z-50 bg-white border border-gray-200 rounded-xl shadow-xl flex p-2 gap-1 animate-in fade-in slide-in-from-top-2 duration-200 ring-1 ring-black/5 min-w-[160px]">
                            <div className="flex flex-col max-h-48 overflow-y-auto custom-scrollbar border-r pr-1">
                                {hours.map(h => (
                                    <button
                                        key={h}
                                        onClick={() => { handleHClick(h); }}
                                        className={`px-3 py-1 text-sm rounded-md transition-colors ${currentH === h ? 'bg-primary-100 text-primary-700 font-bold' : 'hover:bg-gray-100'}`}
                                    >
                                        {h}h
                                    </button>
                                ))}
                            </div>
                            <div className="flex flex-col max-h-48 overflow-y-auto custom-scrollbar pl-1">
                                {minutes.map(m => (
                                    <button
                                        key={m}
                                        onClick={() => { handleMClick(m); }}
                                        className={`px-3 py-1 text-sm rounded-md transition-colors ${currentM === m ? 'bg-primary-100 text-primary-700 font-bold' : 'hover:bg-gray-100'}`}
                                    >
                                        {m}p
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        );
    };

    const currentLich = lichList.find(l => l.id.toString() === selectedLich);
    const isFuture = React.useMemo(() => {
        if (!currentLich?.ngay_lam) return false;
        const today = new Date();
        today.setHours(0,0,0,0);
        const shiftDate = new Date(currentLich.ngay_lam);
        shiftDate.setHours(0,0,0,0);
        return shiftDate > today;
    }, [currentLich]);

    const columns = [
        { 
            header: 'Nhân viên', 
            render: (row) => (
                <Link 
                    to={`/ho-so/${row.nhan_vien_id}`}
                    className="font-bold text-primary-600 hover:text-primary-800 hover:underline transition"
                >
                    {row.ho_ten}
                </Link>
            )
        },
        { 
            header: 'Giờ vào (24h)', 
            render: (row) => (
                <TimeSelect 
                    disabled={selectedTuanInfo?.trang_thai === 'hoan_thanh' || isFuture}
                    value={row.gio_vao} 
                    onChange={(val) => handleSave(row.id, val, row.gio_ra ? format(new Date(row.gio_ra), 'HH:mm') : '')}
                />
            ) 
        },
        { 
            header: 'Giờ ra (24h)', 
            render: (row) => (
                <TimeSelect 
                    disabled={selectedTuanInfo?.trang_thai === 'hoan_thanh' || isFuture}
                    value={row.gio_ra} 
                    onChange={(val) => handleSave(row.id, row.gio_vao ? format(new Date(row.gio_vao), 'HH:mm') : '', val)}
                />
            ) 
        },
        { 
            header: 'Trạng thái', 
            render: (row) => (
                <div className="flex flex-col gap-1 items-start">
                    <Badge status={row.trang_thai} />
                    {row.so_phut_tre > 0 && <span className="text-xs text-orange-600 font-medium whitespace-nowrap">Trễ {row.so_phut_tre} phút</span>}
                </div>
            )
        },
        { 
            header: 'Giờ thực tế', 
            render: (row) => <span className={`font-bold ${row.so_gio_thuc_te < 0 ? 'text-red-600' : 'text-gray-900'}`}>{row.so_gio_thuc_te ? `${row.so_gio_thuc_te}h` : '-'}</span> 
        }
    ];


    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Chấm công ca làm</h1>
                    <p className="mt-1 text-sm text-gray-500">Ghi nhận giờ ra vào và trạng thái đi làm của nhân sự.</p>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-wrap gap-4 items-end">
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Tuần làm việc</label>
                    <select 
                        value={selectedTuan} 
                        onChange={e => setSelectedTuan(e.target.value)}
                        className="block w-[200px] pl-3 pr-8 py-2 text-sm border-gray-300 rounded-md border focus:ring-primary-500"
                    >
                        {tuanList.map(t => (
                            <option key={t.id} value={t.id}>
                                Tuần {format(new Date(t.ngay_bat_dau), 'dd/MM')} - {format(new Date(t.ngay_ket_thuc), 'dd/MM/yyyy')}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Chọn Ca làm việc</label>
                    <select 
                        value={selectedLich} 
                        onChange={e => setSelectedLich(e.target.value)}
                        className="block w-[300px] pl-3 pr-8 py-2 text-sm border-gray-300 rounded-md border focus:ring-primary-500"
                    >
                        {lichList.map(l => (
                            <option key={l.id} value={l.id}>
                                {format(new Date(l.ngay_lam), 'dd/MM/yyyy')} — {l.ten_ca} ({l.gio_bat_dau.slice(0,5)}-{l.gio_ket_thuc.slice(0,5)})
                            </option>
                        ))}
                    </select>
                </div>
                {currentLich && (
                     <div className={`ml-auto flex items-center px-3 py-2 rounded-lg border ${isFuture ? 'bg-orange-50 border-orange-100' : 'bg-blue-50 border-blue-100'}`}>
                        <span className={`text-sm ${isFuture ? 'text-orange-800' : 'text-blue-800'}`}>
                            {isFuture ? (
                                <strong>⚠️ Chưa đến ngày diễn ra ca làm</strong>
                            ) : (
                                <><strong>Ca yêu cầu:</strong> {currentLich.gio_bat_dau.slice(0,5)} — {currentLich.gio_ket_thuc.slice(0,5)}</>
                            )}
                        </span>
                     </div>
                )}
            </div>

            {loading ? (
                <div className="animate-pulse h-48 bg-gray-200 rounded-lg"></div>
            ) : !selectedLich ? (
                <div className="text-center p-8 text-gray-500">Vui lòng chọn ca làm việc.</div>
            ) : chamCong.length === 0 ? (
                <div className="text-center p-8 text-gray-500">Chưa có nhân viên nào được phân công vào ca này.</div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <Table columns={columns} data={chamCong} />
                </div>
            )}
        </div>
    );
};

export default ChamCongCa;
