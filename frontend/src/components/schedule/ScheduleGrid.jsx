import React from 'react';
import ShiftCard from './ShiftCard';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';

const DAYS = [
    { value: 2, label: 'Thứ 2' },
    { value: 3, label: 'Thứ 3' },
    { value: 4, label: 'Thứ 4' },
    { value: 5, label: 'Thứ 5' },
    { value: 6, label: 'Thứ 6' },
    { value: 7, label: 'Thứ 7' },
    { value: 8, label: 'Chủ nhật' }
];

const ScheduleGrid = ({ 
    khungCaList, 
    groupedData, 
    isLocked, 
    handleUpdateKhungCa, 
    handleDuyet, 
    selectedTuanInfo 
}) => {
    const { user } = useAuth();

    return (
        <div className="min-w-[1000px]">
            <div className="grid grid-cols-8 border-b border-gray-200 bg-gray-100 sticky top-0 z-20 shadow-sm">
                <div className="p-4 font-bold text-gray-700 border-r border-gray-200 text-center uppercase text-xs tracking-wider">
                    Khung Ca
                </div>
                {DAYS.map(day => (
                    <div key={day.value} className={`p-4 text-center font-bold uppercase text-xs tracking-wider border-r border-gray-200 last:border-0 ${day.value >= 7 ? 'text-indigo-600' : 'text-gray-700'}`}>
                        {day.label}
                    </div>
                ))}
            </div>

            <div className="divide-y divide-gray-200">
                {khungCaList.map((kc, index) => (
                    <div key={kc.id} className={`grid grid-cols-8 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                        <div className="p-4 border-r border-gray-200 flex flex-col justify-center items-center bg-white sticky left-0 z-10 shadow-[1px_0_4px_rgba(0,0,0,0.05)]">
                            <span className="font-extrabold text-indigo-900 bg-indigo-50 px-3 py-1.5 rounded-xl text-sm mb-2 border border-indigo-100 shadow-sm whitespace-nowrap">
                                {kc.ten_ca}
                            </span>
                            <span className="text-xs text-gray-500 font-semibold mb-4 bg-gray-100 px-2 py-1 rounded">
                                {kc.gio_bat_dau.slice(0,5)} - {kc.gio_ket_thuc.slice(0,5)}
                            </span>
                            
                            <div className="flex flex-col gap-2 w-full px-2">
                                <div className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg bg-gray-50 border border-gray-200 shadow-sm">
                                    <span className="text-gray-500 font-medium">Tối thiểu:</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-indigo-600 min-w-[16px] text-center">{kc.min_nv || 2}</span>
                                        {(user?.vaiTro === 'CST' || user?.vaiTro === 'QLC') && !isLocked && (
                                            <div className="flex flex-col -gap-1">
                                                <button 
                                                    onClick={() => handleUpdateKhungCa(kc.id, (kc.min_nv || 2) + 1, kc.max_nv)}
                                                    className="hover:text-indigo-600 transition-colors hover:bg-indigo-50 rounded"
                                                >
                                                    <ChevronUpIcon className="w-3 h-3" />
                                                </button>
                                                <button 
                                                    onClick={() => handleUpdateKhungCa(kc.id, Math.max(0, (kc.min_nv || 2) - 1), kc.max_nv)}
                                                    className="hover:text-indigo-600 transition-colors hover:bg-indigo-50 rounded"
                                                >
                                                    <ChevronDownIcon className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg bg-gray-50 border border-gray-200 shadow-sm">
                                    <span className="text-gray-500 font-medium">Tối đa:</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-red-600 min-w-[16px] text-center">{kc.max_nv || 4}</span>
                                        {(user?.vaiTro === 'CST' || user?.vaiTro === 'QLC') && !isLocked && (
                                            <div className="flex flex-col -gap-1">
                                                <button 
                                                    onClick={() => handleUpdateKhungCa(kc.id, kc.min_nv, (kc.max_nv || 4) + 1)}
                                                    className="hover:text-red-600 transition-colors hover:bg-red-50 rounded"
                                                >
                                                    <ChevronUpIcon className="w-3 h-3" />
                                                </button>
                                                <button 
                                                    onClick={() => handleUpdateKhungCa(kc.id, kc.min_nv, Math.max(kc.min_nv || 0, (kc.max_nv || 4) - 1))}
                                                    className="hover:text-red-600 transition-colors hover:bg-red-50 rounded"
                                                >
                                                    <ChevronDownIcon className="w-3 h-3" />
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
                                <div key={day.value} className={`p-3 border-r border-gray-200 last:border-0 min-h-[160px] ${isWeekend ? 'bg-indigo-50/10' : ''}`}>
                                    <ShiftCard 
                                        khungCa={kc} 
                                        cellData={cellData} 
                                        isLocked={isLocked}
                                        handleDuyet={handleDuyet}
                                        selectedTuanInfo={selectedTuanInfo}
                                    />
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ScheduleGrid;
