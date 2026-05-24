import React from 'react';

const StatCard = ({ title, value, icon: Icon, colorClass, subValue }) => {
    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 transition-all duration-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 rounded-lg ${colorClass}`}>
                    {Icon && <Icon className="w-5 h-5" />}
                </div>
                {subValue && (
                    <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                        {subValue}
                    </span>
                )}
            </div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
    );
};

export default StatCard;
