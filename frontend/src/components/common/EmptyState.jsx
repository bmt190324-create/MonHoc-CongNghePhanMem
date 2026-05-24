import React from 'react';

const EmptyState = ({ icon: Icon, title, description, action }) => {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
            <div className="mx-auto w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-4">
                {Icon && <Icon className="w-8 h-8" />}
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
            {description && <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">{description}</p>}
            {action && <div>{action}</div>}
        </div>
    );
};

export default EmptyState;
