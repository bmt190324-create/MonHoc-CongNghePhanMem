import React, { useState } from 'react';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';
import { KeyIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Modal from '../common/Modal';

const PasswordChangeModal = ({ isOpen, onClose }) => {
    const [passwordData, setPasswordData] = useState({
        mat_khau_cu: '',
        mat_khau_moi: '',
        xac_nhan_mat_khau: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChangePassword = async (e) => {
        e.preventDefault();
        
        if (!passwordData.mat_khau_moi || passwordData.mat_khau_moi.length < 8) {
            toast.error('Mật khẩu mới phải có ít nhất 8 ký tự');
            return;
        }

        if (passwordData.mat_khau_moi !== passwordData.xac_nhan_mat_khau) {
            toast.error('Mật khẩu xác nhận không khớp');
            return;
        }
        
        setLoading(true);
        try {
            await axiosClient.put('/auth/doi-mat-khau', {
                mat_khau_cu: passwordData.mat_khau_cu,
                mat_khau_moi: passwordData.mat_khau_moi
            });
            toast.success('Đổi mật khẩu thành công');
            onClose();
            setPasswordData({ mat_khau_cu: '', mat_khau_moi: '', xac_nhan_mat_khau: '' });
        } catch (err) {
            toast.error(err.message || 'Lỗi khi đổi mật khẩu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={
                <div className="flex items-center gap-2">
                    <KeyIcon className="w-5 h-5 text-primary-600" />
                    <span>Đổi mật khẩu</span>
                </div>
            }
        >
            <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu hiện tại</label>
                    <input 
                        type="password" required
                        value={passwordData.mat_khau_cu}
                        onChange={e => setPasswordData({...passwordData, mat_khau_cu: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
                <hr className="my-2 border-gray-100" />
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
                    <input 
                        type="password" required minLength="8"
                        value={passwordData.mat_khau_moi}
                        onChange={e => setPasswordData({...passwordData, mat_khau_moi: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Tối thiểu 8 ký tự"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu mới</label>
                    <input 
                        type="password" required minLength="8"
                        value={passwordData.xac_nhan_mat_khau}
                        onChange={e => setPasswordData({...passwordData, xac_nhan_mat_khau: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
                <div className="pt-4 flex gap-3">
                    <button 
                        type="button" onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 text-gray-700 transition-colors"
                        disabled={loading}
                    >
                        Hủy
                    </button>
                    <button 
                        type="submit"
                        className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                        disabled={loading}
                    >
                        {loading ? 'Đang lưu...' : 'Cập nhật'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default PasswordChangeModal;
