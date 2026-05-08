const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SALT_ROUNDS = 12;
const MAX_FAILED = 5;

const generateTokens = (nhanVienId, tenDangNhap) => {
  const accessToken = jwt.sign(
    { nhanVienId, tenDangNhap },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
  );
  const refreshToken = jwt.sign(
    { nhanVienId, tenDangNhap },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d' }
  );
  return { accessToken, refreshToken };
};

// POST /api/auth/login
const login = async (req, res) => {
  const { ten_dang_nhap, mat_khau } = req.body;
  if (!ten_dang_nhap || !mat_khau) {
    return res.status(400).json({ message: 'Vui lòng nhập tên đăng nhập và mật khẩu' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT tk.*, nv.ho_ten, vt.ten_vai_tro, nv.trang_thai
       FROM TaiKhoan tk
       JOIN NhanVien nv ON nv.id = tk.nhan_vien_id
       JOIN VaiTro vt ON vt.id = nv.vai_tro_id
       WHERE tk.ten_dang_nhap = $1`,
      [ten_dang_nhap]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }

    const account = rows[0];

    if (account.bi_khoa) {
      return res.status(403).json({ message: 'Tài khoản đã bị khóa sau nhiều lần đăng nhập sai. Liên hệ quản trị viên.' });
    }

    if (!account.trang_thai) {
      return res.status(403).json({ message: 'Tài khoản nhân viên đã bị vô hiệu hóa' });
    }

    const passOk = await bcrypt.compare(mat_khau, account.mat_khau_hash);

    if (!passOk) {
      const newCount = account.so_lan_sai + 1;
      const shouldLock = newCount >= MAX_FAILED;
      await pool.query(
        `UPDATE TaiKhoan SET so_lan_sai = $1, bi_khoa = $2 WHERE id = $3`,
        [newCount, shouldLock, account.id]
      );
      if (shouldLock) {
        return res.status(403).json({ message: `Sai mật khẩu ${MAX_FAILED} lần — tài khoản đã bị khóa. Liên hệ quản trị viên.` });
      }
      return res.status(401).json({ message: `Sai mật khẩu. Còn ${MAX_FAILED - newCount} lần thử.` });
    }

    // Đặt lại số lần sai
    await pool.query(
      `UPDATE TaiKhoan SET so_lan_sai = 0, lan_dang_nhap_cuoi = NOW() WHERE id = $1`,
      [account.id]
    );

    const { accessToken, refreshToken } = generateTokens(account.nhan_vien_id, account.ten_dang_nhap);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      accessToken,
      user: {
        id: account.nhan_vien_id,
        hoTen: account.ho_ten,
        tenDangNhap: account.ten_dang_nhap,
        vaiTro: account.ten_vai_tro,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
};

// POST /api/auth/logout
const logout = (req, res) => {
  res.clearCookie('refreshToken');
  return res.json({ message: 'Đăng xuất thành công' });
};

// POST /api/auth/refresh
const refresh = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ message: 'Không có refresh token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const { accessToken, refreshToken } = generateTokens(decoded.nhanVienId, decoded.tenDangNhap);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ accessToken });
  } catch {
    return res.status(401).json({ message: 'Refresh token không hợp lệ hoặc đã hết hạn' });
  }
};

// PUT /api/auth/doi-mat-khau
const doiMatKhau = async (req, res) => {
  const { mat_khau_cu, mat_khau_moi } = req.body;
  if (!mat_khau_cu || !mat_khau_moi) {
    return res.status(400).json({ message: 'Vui lòng nhập mật khẩu cũ và mật khẩu mới' });
  }
  if (mat_khau_moi.length < 8) {
    return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 8 ký tự' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT mat_khau_hash FROM TaiKhoan WHERE nhan_vien_id = $1`,
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Tài khoản không tồn tại' });

    const passOk = await bcrypt.compare(mat_khau_cu, rows[0].mat_khau_hash);
    if (!passOk) return res.status(401).json({ message: 'Mật khẩu cũ không đúng' });

    const newHash = await bcrypt.hash(mat_khau_moi, SALT_ROUNDS);
    await pool.query(
      `UPDATE TaiKhoan SET mat_khau_hash = $1 WHERE nhan_vien_id = $2`,
      [newHash, req.user.id]
    );

    return res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
};

// PUT /api/auth/mo-khoa/:nhanVienId (CST only)
const moKhoa = async (req, res) => {
  const { nhanVienId } = req.params;
  try {
    const { rowCount } = await pool.query(
      `UPDATE TaiKhoan SET bi_khoa = FALSE, so_lan_sai = 0 WHERE nhan_vien_id = $1`,
      [nhanVienId]
    );
    if (rowCount === 0) return res.status(404).json({ message: 'Tài khoản không tồn tại' });
    return res.json({ message: 'Mở khóa tài khoản thành công' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
};

// GET /api/auth/tai-khoan-bi-khoa (CST only)
const getTaiKhoanBiKhoa = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT tk.id, tk.ten_dang_nhap, tk.so_lan_sai, tk.bi_khoa, tk.lan_dang_nhap_cuoi,
              nv.ho_ten, vt.ten_vai_tro
       FROM TaiKhoan tk
       JOIN NhanVien nv ON nv.id = tk.nhan_vien_id
       JOIN VaiTro vt ON vt.id = nv.vai_tro_id
       WHERE tk.bi_khoa = TRUE`
    );
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
};

// PUT /api/auth/reset-password/:nhanVienId (CST only)
const datLaiMatKhau = async (req, res) => {
  const { nhanVienId } = req.params;
  const { mat_khau_moi } = req.body;

  if (!mat_khau_moi || mat_khau_moi.length < 8) {
    return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 8 ký tự' });
  }

  try {
    const newHash = await bcrypt.hash(mat_khau_moi, SALT_ROUNDS);
    const { rowCount } = await pool.query(
      `UPDATE TaiKhoan SET mat_khau_hash = $1, so_lan_sai = 0, bi_khoa = FALSE 
       WHERE nhan_vien_id = $2`,
      [newHash, nhanVienId]
    );

    if (rowCount === 0) return res.status(404).json({ message: 'Tài khoản không tồn tại' });
    return res.json({ message: 'Đặt lại mật khẩu thành công' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
};

module.exports = { login, logout, refresh, doiMatKhau, moKhoa, getTaiKhoanBiKhoa, datLaiMatKhau };
