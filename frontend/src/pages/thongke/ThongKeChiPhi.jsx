import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { CurrencyDollarIcon, UsersIcon, ClockIcon } from '@heroicons/react/24/outline';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a855f7'];

const ThongKeChiPhi = () => {
    const [thang, setThang] = useState(new Date().getMonth() + 1);
    const [nam, setNam] = useState(new Date().getFullYear());
    const [tongQuan, setTongQuan] = useState(null);
    const [chiPhi, setChiPhi] = useState([]);
    const [nhanSu, setNhanSu] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [tongQuanRes, chiPhiRes, nhanSuRes] = await Promise.all([
                    axiosClient.get(`/thong-ke/tong-quan?thang=${thang}&nam=${nam}`),
                    axiosClient.get(`/thong-ke/chi-phi-luong?nam=${nam}`), // Lấy cả năm để vẽ biểu đồ
                    axiosClient.get(`/thong-ke/nhan-su-ca?thang=${thang}&nam=${nam}`)
                ]);
                setTongQuan(tongQuanRes);
                setChiPhi(chiPhiRes);
                setNhanSu(nhanSuRes);
            } catch (err) {
                toast.error(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [thang, nam]);

    if (loading || !tongQuan) {
        return <div className="animate-pulse h-[500px] bg-gray-100 rounded-xl"></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Báo Cáo Thống Kê</h1>
                    <p className="mt-1 text-sm text-gray-500">Tổng quan chi phí và tình hình nhân sự.</p>
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

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <CurrencyDollarIcon className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Tổng chi phí lương (Tháng {thang})</p>
                        <h3 className="text-2xl font-bold text-gray-900">{parseInt(tongQuan.tong_chi_phi_luong || 0).toLocaleString('vi-VN')} đ</h3>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                        <UsersIcon className="w-8 h-8" />
                    </div>
                    <div>
                         <p className="text-sm font-medium text-gray-500 mb-1">Tổng nhân viên đóng góp</p>
                         <h3 className="text-2xl font-bold text-gray-900">{tongQuan.tong_nhan_vien || 0} người</h3>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                        <ClockIcon className="w-8 h-8" />
                    </div>
                    <div>
                         <p className="text-sm font-medium text-gray-500 mb-1">Tổng giờ làm</p>
                         <h3 className="text-2xl font-bold text-gray-900">{tongQuan.tong_gio_lam || 0} giờ</h3>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tỉ lệ bố trí nhân sự theo Ca */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold mb-4 text-gray-800">Tỉ lệ bố trí nhân sự theo Ca (Tháng {thang})</h3>
                    <div className="h-80 flex items-center justify-center relative">
                        {nhanSu.reduce((acc, curr) => acc + parseInt(curr.so_nv_phan_cong), 0) === 0 ? (
                            <div className="text-center">
                                <div className="w-32 h-32 border-4 border-dashed border-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                                    <UsersIcon className="w-10 h-10 text-gray-300" />
                                </div>
                                <p className="text-gray-400 text-sm">Chưa có dữ liệu phân công ca trong tháng này.</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={nhanSu}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="so_nv_phan_cong"
                                        nameKey="ten_ca"
                                        label={({ ten_ca, percent }) => `${ten_ca} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {nhanSu.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Biểu đồ chi phí */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold mb-4 text-gray-800">Biểu đồ chi phí quỹ lương {nam}</h3>
                    <div className="h-80">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={Array.from({length: 12}, (_, i) => {
                                    const m = i + 1;
                                    const dataOfmonth = chiPhi.find(c => c.thang === m);
                                    return dataOfmonth || { thang: m, tong_chi_phi: 0 };
                                })}
                                margin={{ top: 20, right: 30, left: 40, bottom: 25 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis 
                                    dataKey="thang" 
                                    interval={0} 
                                    tickFormatter={(val) => val} 
                                    stroke="#6B7280"
                                    label={{ value: 'Tháng', position: 'insideBottomRight', offset: -5, fontSize: 12, fill: '#6B7280' }}
                                />
                                <YAxis 
                                    stroke="#6B7280" 
                                    tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
                                    label={{ value: 'Chi phí (VNĐ)', angle: -90, position: 'insideLeft', fontSize: 12, fill: '#6B7280' }}
                                />
                                <Tooltip 
                                    formatter={(value) => [`${value.toLocaleString('vi-VN')} đ`, 'Chi phí']}
                                    labelFormatter={(val) => `Tháng ${val}`}
                                />
                                <Bar dataKey="tong_chi_phi" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Bảng tổng hợp chi phí 12 tháng */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800">Bảng tổng hợp chi phí năm {nam}</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
                            <tr>
                                <th className="px-6 py-4">Tháng</th>
                                <th className="px-6 py-4 text-right">Tổng chi phí</th>
                                <th className="px-6 py-4 text-right">Lương cơ bản</th>
                                <th className="px-6 py-4 text-right">Thưởng/Phạt</th>
                                <th className="px-6 py-4 text-right">Nhân sự</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {Array.from({length: 12}, (_, i) => {
                                const m = i + 1;
                                const data = chiPhi.find(c => c.thang === m) || { 
                                    thang: m, 
                                    tong_chi_phi: 0, 
                                    tong_luong_co_ban: 0, 
                                    tong_thuong_phat: 0, 
                                    so_nhan_vien: 0 
                                };
                                return (
                                    <tr key={m} className={m === parseInt(thang) ? 'bg-primary-50/50' : ''}>
                                        <td className="px-6 py-4 font-medium text-gray-900">Tháng {m}</td>
                                        <td className="px-6 py-4 text-right font-semibold text-gray-800">
                                            {parseInt(data.tong_chi_phi).toLocaleString('vi-VN')} đ
                                        </td>
                                        <td className="px-6 py-4 text-right text-gray-500">
                                            {parseInt(data.tong_luong_co_ban).toLocaleString('vi-VN')} đ
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={data.tong_thuong_phat >= 0 ? 'text-green-600' : 'text-red-500'}>
                                                {data.tong_thuong_phat > 0 ? '+' : ''}
                                                {parseInt(data.tong_thuong_phat).toLocaleString('vi-VN')} đ
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-gray-500">{data.so_nhan_vien} người</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ThongKeChiPhi;
