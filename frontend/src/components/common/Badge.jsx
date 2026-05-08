import React from 'react';

const statusStyles = {
  cho_duyet: 'bg-yellow-100 text-yellow-800 border bg-yellow-200/50 border-yellow-200',
  da_duyet: 'bg-green-100 text-green-800 border bg-green-200/50 border-green-200',
  tu_choi: 'bg-red-100 text-red-800 border bg-red-200/50 border-red-200',
  
  hop_le: 'bg-green-100 text-green-800 border bg-green-200/50 border-green-200',
  di_tre: 'bg-orange-100 text-orange-800 border bg-orange-200/50 border-orange-200',
  vang_mat: 'bg-red-100 text-red-800 border bg-red-200/50 border-red-200',
  chua_cham: 'bg-gray-100 text-gray-800 border bg-gray-200/50 border-gray-200',
  
  mo: 'bg-blue-100 text-blue-800',
  khoa: 'bg-orange-100 text-orange-800',
  hoan_thanh: 'bg-emerald-100 text-emerald-800',

  nhap: 'bg-gray-100 text-gray-600 border border-gray-200',
  da_tra: 'bg-blue-100 text-blue-700 border border-blue-200',
};

const statusLabels = {
  cho_duyet: 'Chờ duyệt',
  da_duyet: 'Đã duyệt',
  tu_choi: 'Từ chối',
  
  hop_le: 'Hợp lệ',
  di_tre: 'Đi trễ',
  vang_mat: 'Vắng mặt',
  chua_cham: 'Chưa chấm',
  
  mo: 'Mở ĐK',
  khoa: 'Khóa ĐK',
  hoan_thanh: 'Hoàn thành',

  nhap: 'Nháp',
  da_tra: 'Đã thanh toán',
};

const Badge = ({ status }) => {
  const style = statusStyles[status] || 'bg-gray-100 text-gray-800';
  const label = statusLabels[status] || status;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}>
      {label}
    </span>
  );
};

export default Badge;
