import React from 'react';

const PageHeader = ({ title, description, action }) => {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
                {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
            </div>
            {action && <div>{action}</div>}
        </div>
    );
};

export default PageHeader;
