import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const PrivateRoute = ({ allowedRoles, children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.vaiTro)) {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
            <div className="text-4xl font-bold text-red-500 mb-4">403</div>
            <h1 className="text-2xl font-semibold text-gray-800 mb-2">Không có quyền truy cập</h1>
            <p className="text-gray-600">Bạn không có quyền xem trang này.</p>
        </div>
    );
  }

  return children ? children : <Outlet />;
};

export default PrivateRoute;
