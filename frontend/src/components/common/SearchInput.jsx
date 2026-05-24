import React from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const SearchInput = ({ value, onChange, placeholder = 'Tìm kiếm...' }) => {
    return (
        <div className="relative flex-1 min-w-[200px] max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
            </div>
            <input
                type="text"
                className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm shadow-sm transition-colors"
                placeholder={placeholder}
                value={value}
                onChange={onChange}
            />
        </div>
    );
};

export default SearchInput;
