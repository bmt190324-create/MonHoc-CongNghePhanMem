/**
 * RBAC Middleware — Phân quyền theo vai trò
 * Sử dụng: requireRole('CST') hoặc requireRole('QLC', 'CST')
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Chưa xác thực' });
  }
  if (!roles.includes(req.user.vai_tro)) {
    return res.status(403).json({
      message: `Không có quyền thực hiện thao tác này. Yêu cầu vai trò: ${roles.join(' hoặc ')}`
    });
  }
  next();
};

module.exports = { requireRole };
