import React from 'react';

const SkeletonTable = ({ columns = 5, rows = 5 }) => {
    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden animate-pulse">
            <div className="flex items-center px-6 py-4 border-b border-gray-200 bg-gray-50">
                {Array.from({ length: columns }).map((_, i) => (
                    <div key={`header-${i}`} className="flex-1 h-4 bg-gray-200 rounded mr-4 last:mr-0"></div>
                ))}
            </div>
            <div>
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={`row-${i}`} className="flex items-center px-6 py-4 border-b border-gray-100 last:border-none">
                        {Array.from({ length: columns }).map((_, j) => (
                            <div key={`col-${i}-${j}`} className="flex-1 h-4 bg-gray-100 rounded mr-4 last:mr-0"></div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SkeletonTable;
