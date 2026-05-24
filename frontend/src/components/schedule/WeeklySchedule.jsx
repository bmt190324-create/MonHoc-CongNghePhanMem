import React, { useMemo } from 'react';
import ScheduleGrid from './ScheduleGrid';

const WeeklySchedule = ({ 
    khungCaList, 
    danhSach, 
    isLocked, 
    handleUpdateKhungCa, 
    handleDuyet, 
    selectedTuanInfo,
    loading
}) => {
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

    return (
        <div className="flex-1 overflow-auto bg-white rounded-2xl shadow-sm border border-gray-200 relative">
            {loading && (
                <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-sm z-30 rounded-2xl">
                    <div className="animate-pulse flex flex-col items-center">
                        <div className="h-10 w-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-3"></div>
                        <span className="text-primary-700 font-bold tracking-wide">Đang tải lịch trình...</span>
                    </div>
                </div>
            )}

            <ScheduleGrid 
                khungCaList={khungCaList} 
                groupedData={groupedData} 
                isLocked={isLocked}
                handleUpdateKhungCa={handleUpdateKhungCa}
                handleDuyet={handleDuyet}
                selectedTuanInfo={selectedTuanInfo}
            />
        </div>
    );
};

export default WeeklySchedule;
