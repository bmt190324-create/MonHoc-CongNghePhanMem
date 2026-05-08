import React, { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const FormNV = ({ isOpen, onClose, nvId, onSuccess }) => {
  const [formData, setFormData] = useState({
    ho_ten: '',
    cccd: '',
    the_sinh_vien: '',
    so_tai_khoan: '',
    vai_tro_id: 3, // NV mặc định
    ten_dang_nhap: '',
    mat_khau: ''
  });
  const [loading, setLoading] = useState(false);
  const [showSensitive, setShowSensitive] = useState({
    cccd: false,
    stk: false
  });
  const isEdit = !!nvId;

  const toggleShow = (field) => {
    setShowSensitive(prev => ({ ...prev, [field]: !prev[field] }));
  };

  useEffect(() => {
    if (isOpen && isEdit) {
      // ... (fetchData giữ nguyên như trước)
      const fetchData = async () => {
        try {
          const data = await axiosClient.get(`/nhan-vien/${nvId}`);
          setFormData({
            ho_ten: data.ho_ten || '',
            cccd: data.cccd || '',
            the_sinh_vien: data.the_sinh_vien || '',
            so_tai_khoan: data.so_tai_khoan || '',
            vai_tro_id: data.vai_tro_id || 3,
            ten_dang_nhap: data.ten_dang_nhap || '',
            mat_khau: ''
          });
        } catch (err) {
          toast.error(err.message);
        }
      };
      fetchData();
    } else if (isOpen) {
      setFormData({
        ho_ten: '', cccd: '', the_sinh_vien: '', so_tai_khoan: '',
        vai_tro_id: 3, ten_dang_nhap: '', mat_khau: ''
      });
      setShowSensitive({ cccd: false, stk: false });
    }
  }, [isOpen, nvId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await axiosClient.put(`/nhan-vien/${nvId}`, formData);
        toast.success('Cập nhật nhân viên thành công');
      } else {
        await axiosClient.post('/nhan-vien', formData);
        toast.success('Thêm nhân viên thành công');
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Sửa nhân viên' : 'Thêm nhân viên mới'} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Họ tên *</label>
                <input type="text" name="ho_ten" required value={formData.ho_ten} onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">CCCD</label>
                <div className="mt-1 relative flex items-center">
                    <input 
                        type={showSensitive.cccd ? 'text' : 'password'} 
                        name="cccd" 
                        value={formData.cccd} 
                        onChange={handleChange}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border pr-10" 
                    />
                    <button 
                        type="button" 
                        onClick={() => toggleShow('cccd')}
                        className="absolute right-2 text-gray-400 hover:text-gray-600 outline-none"
                    >
                        {showSensitive.cccd ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Vai trò *</label>
                <select name="vai_tro_id" required value={formData.vai_tro_id} onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border bg-white">
                    <option value={3}>Nhân viên (NV)</option>
                    <option value={2}>Quản lý ca (QLC)</option>
                    <option value={1}>Chủ siêu thị (CST)</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Thẻ sinh viên</label>
                <input type="text" name="the_sinh_vien" value={formData.the_sinh_vien} onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border" />
            </div>
            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Số tài khoản ngân hàng</label>
                <div className="mt-1 relative flex items-center">
                    <input 
                        type={showSensitive.stk ? 'text' : 'password'} 
                        name="so_tai_khoan" 
                        value={formData.so_tai_khoan} 
                        onChange={handleChange}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border pr-10" 
                    />
                    <button 
                        type="button" 
                        onClick={() => toggleShow('stk')}
                        className="absolute right-2 text-gray-400 hover:text-gray-600 outline-none"
                    >
                        {showSensitive.stk ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                </div>
            </div>
        </div>

        {!isEdit && (
            <>
                <hr className="my-4" />
                <h4 className="text-sm font-medium text-gray-900 mb-2">Tài khoản đăng nhập</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tên đăng nhập *</label>
                        <input type="text" name="ten_dang_nhap" required value={formData.ten_dang_nhap} onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Mật khẩu *</label>
                        <input type="password" name="mat_khau" required minLength={8} value={formData.mat_khau} onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border" />
                    </div>
                </div>
            </>
        )}

        <div className="pt-4 flex justify-end gap-3 border-t border-gray-200 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none">
                Hủy
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none disabled:bg-gray-400">
                {loading ? 'Đang lưu...' : 'Lưu nhân viên'}
            </button>
        </div>
      </form>
    </Modal>
  );
};

export default FormNV;
