const pool = require('../config/db');
const { handlePgError } = require('../middleware/errorHandler');

// GET /api/thong-bao
const getAll = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT tb.*, nv.ho_ten as nguoi_tao_ten, vt.ten_vai_tro as nguoi_tao_vai_tro
       FROM ThongBao tb
       JOIN NhanVien nv ON nv.id = tb.nguoi_tao
       JOIN VaiTro vt ON vt.id = nv.vai_tro_id
       ORDER BY tb.is_pinned DESC, tb.ngay_tao DESC
       LIMIT 50`
    );
    return res.json(rows);
  } catch (err) { return handlePgError(err, res); }
};

// POST /api/thong-bao
const create = async (req, res) => {
  const { tieu_de, noi_dung, muc_do } = req.body;
  if (!tieu_de || !noi_dung) {
    return res.status(400).json({ message: 'Thiếu tiêu đề hoặc nội dung thông báo' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO ThongBao (tieu_de, noi_dung, muc_do, nguoi_tao) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [tieu_de, noi_dung, muc_do || 'info', req.user.id]
    );
    return res.status(201).json(rows[0]);
  } catch (err) { return handlePgError(err, res); }
};

// PATCH /api/thong-bao/:id/pin
const togglePin = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `UPDATE ThongBao SET is_pinned = NOT is_pinned WHERE id = $1 RETURNING *`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Thông báo không tồn tại' });
    return res.json(rows[0]);
  } catch (err) { return handlePgError(err, res); }
};

module.exports = { getAll, create, togglePin };
