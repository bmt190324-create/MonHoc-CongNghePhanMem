import React from 'react';

const FilterSelect = ({ value, onChange, options, label, className = "" }) => {
    return (
        <div className={`flex items-center min-w-[150px] ${className}`}>
            {label && <label className="mr-2 text-sm font-medium text-gray-700 whitespace-nowrap">{label}:</label>}
            <select
                value={value}
                onChange={onChange}
                className="block w-full py-2 pl-3 pr-8 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors cursor-pointer"
            >
                {options.map((opt, idx) => (
                    <option key={idx} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    );
};

export default FilterSelect;
