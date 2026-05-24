import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Confirm from '../../components/common/Confirm';
import FormNV from './FormNV';
import toast from 'react-hot-toast';
import { PlusIcon, PencilSquareIcon, TrashIcon, KeyIcon, ArrowPathIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import Modal from '../../components/common/Modal';
import PageHeader from '../../components/common/PageHeader';
import SkeletonTable from '../../components/common/SkeletonTable';
import EmptyState from '../../components/common/EmptyState';
import { UserGroupIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import SearchInput from '../../components/common/SearchInput';
import FilterSelect from '../../components/common/FilterSelect';

const DanhSachNV = () => {
  const [nhanViens, setNhanViens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const roleOptions = [
      { value: '', label: 'Tất cả vai trò' },
      { value: 'CST', label: 'Chủ siêu thị' },
      { value: 'QLC', label: 'Quản lý ca' },
      { value: 'NV', label: 'Nhân viên' }
  ];

  const statusOptions = [
      { value: '', label: 'Tất cả trạng thái' },
      { value: 'hoat_dong', label: 'Đang hoạt động' },
      { value: 'vo_hieu_hoa', label: 'Đã vô hiệu hóa' },
      { value: 'bi_khoa', label: 'Bị khóa' }
  ];

  const filteredNhanViens = nhanViens.filter(nv => {
      const term = searchTerm.trim().toLowerCase();
      const matchSearch = term === '' || 
          (nv.ho_ten && nv.ho_ten.toLowerCase().includes(term)) || 
          (nv.ten_dang_nhap && nv.ten_dang_nhap.toLowerCase().includes(term));
      if (!matchSearch) return false;

      if (roleFilter && nv.ten_vai_tro !== roleFilter) return false;

      if (statusFilter === 'hoat_dong' && (!nv.trang_thai || nv.bi_khoa)) return false;
      if (statusFilter === 'vo_hieu_hoa' && nv.trang_thai) return false;
      if (statusFilter === 'bi_khoa' && !nv.bi_khoa) return false;

      return true;
  });

  const fetchNhanViens = async () => {
    // ... (fetchNhanViens giữ nguyên)
    try {
      setLoading(true);
      const data = await axiosClient.get('/nhan-vien');
      setNhanViens(data);
    } catch (err) {
      toast.error(err.message || 'Lỗi khi tải danh sách nhân viên');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNhanViens();
  }, []);

  const handleDelete = async () => {
    try {
      await axiosClient.delete(`/nhan-vien/${selectedId}`);
      toast.success('Đã vô hiệu hóa và khóa tài khoản nhân viên');
      fetchNhanViens();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRestore = async (id) => {
    try {
        await axiosClient.patch(`/nhan-vien/${id}/restore`);
        toast.success('Đã khôi phục nhân viên thành công');
        fetchNhanViens();
    } catch (err) {
        toast.error(err.message);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) return toast.error('Mật khẩu phải từ 8 ký tự');
    try {
        await axiosClient.put(`/auth/reset-password/${selectedId}`, { mat_khau_moi: newPassword });
        toast.success('Đã đặt lại mật khẩu thành công');
        setResetOpen(false);
        setNewPassword('');
        fetchNhanViens();
    } catch (err) {
        toast.error(err.message);
    }
  };

  const handleMoKhoa = async (nvId) => {
    try {
      await axiosClient.put(`/auth/mo-khoa/${nvId}`);
      toast.success('Đã mở khóa tài khoản thành công');
      fetchNhanViens();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAdd = () => {
    setSelectedId(null);
    setFormOpen(true);
  };

  const handleEdit = (id) => {
    setSelectedId(id);
    setFormOpen(true);
  };

  const columns = [
    { header: 'ID', accessor: 'id', className: 'w-16' },
    { 
        header: 'Nhân viên', 
        render: (row) => (
            <div>
                <Link 
                    to={`/ho-so/${row.id}`}
                    className="font-bold text-primary-600 hover:text-primary-800 hover:underline transition"
                >
                    {row.ho_ten}
                </Link>
                <p className="text-xs text-gray-500">{row.ten_dang_nhap}</p>
            </div>
        )
    },
    { header: 'Vai trò', render: (row) => <Badge status={row.ten_vai_tro === 'CST' ? 'khoa' : row.ten_vai_tro === 'QLC' ? 'mo' : 'hoan_thanh'} /> },
    { 
        header: 'Trạng thái', 
        render: (row) => (
            <div className="space-y-1">
                <div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${row.trang_thai ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {row.trang_thai ? 'Hoạt động' : 'Vô hiệu hóa'}
                    </span>
                </div>
                {row.bi_khoa && (
                    <div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                            Bị khóa (Sai Mk {row.so_lan_sai} lần)
                        </span>
                    </div>
                )}
            </div>
        )
    },
    { header: 'Ngày tạo', render: (row) => format(new Date(row.ngay_tao), 'dd/MM/yyyy') },
    {
      header: 'Thao tác',
      render: (row) => (
        <div className="flex items-center gap-2">
            <button 
                onClick={() => { setSelectedId(row.id); setResetOpen(true); }}
                className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                title="Đặt lại mật khẩu"
            >
                <ShieldCheckIcon className="w-5 h-5" />
            </button>
            {row.bi_khoa && (
                <button 
                    onClick={() => handleMoKhoa(row.id)}
                    className="p-1 text-orange-600 hover:bg-orange-50 rounded"
                    title="Mở khóa tài khoản"
                >
                    <KeyIcon className="w-5 h-5" />
                </button>
            )}
            <button 
                onClick={() => handleEdit(row.id)}
                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            >
                <PencilSquareIcon className="w-5 h-5" />
            </button>
            {row.trang_thai ? (
                <button 
                    onClick={() => { setSelectedId(row.id); setConfirmOpen(true); }}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                    title="Vô hiệu hóa & Khóa tài khoản"
                >
                    <TrashIcon className="w-5 h-5" />
                </button>
            ) : (
                <button 
                    onClick={() => handleRestore(row.id)}
                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                    title="Phục hồi nhân viên"
                >
                    <ArrowPathIcon className="w-5 h-5" />
                </button>
            )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
          title="Quản lý nhân viên"
          description="Danh sách nhân sự, phân vai trò và trạng thái tài khoản."
          action={
              <button 
                  onClick={handleAdd}
                  className="inline-flex items-center justify-center bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors shadow-sm font-medium"
              >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Thêm nhân viên
              </button>
          }
      />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <SearchInput 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              placeholder="Tìm theo họ tên, tên đăng nhập..." 
          />
          <div className="flex flex-1 gap-4 sm:justify-end">
              <FilterSelect 
                  value={roleFilter} 
                  onChange={e => setRoleFilter(e.target.value)} 
                  options={roleOptions} 
              />
              <FilterSelect 
                  value={statusFilter} 
                  onChange={e => setStatusFilter(e.target.value)} 
                  options={statusOptions} 
              />
          </div>
      </div>

      {loading ? (
        <SkeletonTable columns={6} rows={5} />
      ) : nhanViens.length === 0 ? (
        <EmptyState 
            icon={UserGroupIcon}
            title="Chưa có nhân viên nào"
            description="Hãy bắt đầu bằng cách thêm nhân viên mới vào hệ thống."
            action={
                <button 
                    onClick={handleAdd}
                    className="mt-2 inline-flex items-center justify-center bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors shadow-sm font-medium text-sm"
                >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Thêm ngay
                </button>
            }
        />
      ) : filteredNhanViens.length === 0 ? (
        <EmptyState 
            icon={MagnifyingGlassIcon}
            title="Không tìm thấy kết quả"
            description="Thử thay đổi từ khóa hoặc bộ lọc để xem kết quả."
        />
      ) : (
        <Table columns={columns} data={filteredNhanViens} />
      )}

      <FormNV 
          isOpen={formOpen}
          onClose={() => setFormOpen(false)}
          nvId={selectedId}
          onSuccess={fetchNhanViens}
      />

      <Modal isOpen={resetOpen} onClose={() => setResetOpen(false)} title="Đặt lại mật khẩu">
            <form onSubmit={handleResetPassword} className="space-y-4">
                <p className="text-sm text-gray-600">Nhập mật khẩu mới cho nhân viên. Tài khoản cũng sẽ được tự động mở khóa nếu đang bị khóa.</p>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Mật khẩu mới (tối thiểu 8 ký tự)</label>
                    <input 
                        type="password" 
                        required 
                        minLength={8}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border" 
                        placeholder="Nhập mật khẩu mới..."
                    />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <button type="button" onClick={() => setResetOpen(false)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 border rounded-md">
                        Hủy
                    </button>
                    <button type="submit" className="px-4 py-2 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-md">
                        Đặt lại mật khẩu
                    </button>
                </div>
            </form>
      </Modal>

      <Confirm 
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleDelete}
          title="Vô hiệu hóa nhân viên"
          message="Bạn có chắc chắn muốn vô hiệu hóa nhân viên này? Tài khoản của họ sẽ không thể đăng nhập nữa, nhưng dữ liệu vẫn được lưu trữ."
          confirmText="Vô hiệu hóa"
      />
    </div>
  );
};

export default DanhSachNV;
