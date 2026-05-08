const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Không có token xác thực' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // Check account lock status
    const { rows } = await pool.query(
      `SELECT tk.bi_khoa, nv.trang_thai, nv.vai_tro_id, vt.ten_vai_tro
       FROM TaiKhoan tk
       JOIN NhanVien nv ON nv.id = tk.nhan_vien_id
       JOIN VaiTro vt ON vt.id = nv.vai_tro_id
       WHERE tk.nhan_vien_id = $1`,
      [decoded.nhanVienId]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Tài khoản không tồn tại' });
    }

    const account = rows[0];
    if (account.bi_khoa) {
      return res.status(403).json({ message: 'Tài khoản đã bị khóa. Liên hệ quản trị viên.' });
    }
    if (!account.trang_thai) {
      return res.status(403).json({ message: 'Tài khoản nhân viên đã bị vô hiệu hóa' });
    }

    req.user = {
      id: decoded.nhanVienId,
      tenDangNhap: decoded.tenDangNhap,
      vai_tro: account.ten_vai_tro,
      vai_tro_id: account.vai_tro_id,
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token đã hết hạn', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ message: 'Token không hợp lệ' });
  }
};

module.exports = auth;
