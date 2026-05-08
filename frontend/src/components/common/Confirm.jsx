import React from 'react';
import Modal from './Modal';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const Confirm = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Xác nhận', cancelText = 'Hủy', variant = 'danger' }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col items-center text-center">
        <ExclamationTriangleIcon 
            className={`w-12 h-12 mb-4 ${variant === 'danger' ? 'text-red-500' : 'text-yellow-500'}`} 
        />
        <p className="text-gray-600 mb-6">{message}</p>
        
        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors ${
                variant === 'danger' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-primary-600 hover:bg-primary-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default Confirm;
