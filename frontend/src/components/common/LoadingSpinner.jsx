import React from 'react';

const LoadingSpinner = ({ text = 'Đang tải dữ liệu...', fullScreen = false }) => {
    const spinner = (
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            {text && <p className="text-sm text-gray-500 font-medium">{text}</p>}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
                {spinner}
            </div>
        );
    }

    return spinner;
};

export default LoadingSpinner;
