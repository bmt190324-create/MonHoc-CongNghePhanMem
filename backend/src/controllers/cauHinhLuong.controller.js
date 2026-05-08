const pool = require('../config/db');
const { handlePgError } = require('../middleware/errorHandler');

// GET /api/cau-hinh-luong
const getAll = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT chl.*, nv.ho_ten as nguoi_tao_ten
       FROM CauHinhLuong chl
       LEFT JOIN NhanVien nv ON nv.id = chl.nguoi_tao
       ORDER BY chl.ngay_ap_dung DESC`
    );
    return res.json(rows);
  } catch (err) { return handlePgError(err, res); }
};

// POST /api/cau-hinh-luong (INSERT-only)
const create = async (req, res) => {
  const { don_gia_gio, ngay_ap_dung, ghi_chu } = req.body;
  if (!don_gia_gio || !ngay_ap_dung) {
    return res.status(400).json({ message: 'Thiếu don_gia_gio hoặc ngay_ap_dung' });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO CauHinhLuong (don_gia_gio, ngay_ap_dung, ghi_chu, nguoi_tao)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [don_gia_gio, ngay_ap_dung, ghi_chu || null, req.user.id]
    );
    return res.status(201).json(rows[0]);
  } catch (err) { return handlePgError(err, res); }
};

module.exports = { getAll, create };
