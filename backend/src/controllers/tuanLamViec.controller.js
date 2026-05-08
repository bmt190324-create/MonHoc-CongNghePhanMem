const pool = require('../config/db');
const { handlePgError } = require('../middleware/errorHandler');

// GET /api/tuan-lam-viec
const getAll = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT t.*, 
        (SELECT COUNT(*) FROM DangKyCa dk WHERE dk.tuan_id = t.id AND dk.trang_thai = 'cho_duyet') as so_dang_ky_cho_duyet
       FROM TuanLamViec t ORDER BY t.ngay_bat_dau DESC`
    );
    return res.json(rows);
  } catch (err) { return handlePgError(err, res); }
};

// POST /api/tuan-lam-viec
const create = async (req, res) => {
  const { ngay_bat_dau, ngay_ket_thuc, deadline_dk } = req.body;
  if (!ngay_bat_dau || !ngay_ket_thuc || !deadline_dk) {
    return res.status(400).json({ message: 'Thiếu thông tin tuần làm việc' });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO TuanLamViec (ngay_bat_dau, ngay_ket_thuc, deadline_dk)
       VALUES ($1, $2, $3) RETURNING *`,
      [ngay_bat_dau, ngay_ket_thuc, deadline_dk]
    );
    return res.status(201).json(rows[0]);
  } catch (err) { return handlePgError(err, res); }
};

// PUT /api/tuan-lam-viec/:id/trang-thai
const updateTrangThai = async (req, res) => {
  const { id } = req.params;
  const { trang_thai } = req.body;
  const valid = ['mo', 'khoa', 'hoan_thanh'];
  if (!valid.includes(trang_thai)) {
    return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
  }
  try {
    const { rows } = await pool.query(
      `UPDATE TuanLamViec SET trang_thai = $1 WHERE id = $2 RETURNING *`,
      [trang_thai, id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Tuần không tồn tại' });
    return res.json(rows[0]);
  } catch (err) { return handlePgError(err, res); }
};

// PUT /api/tuan-lam-viec/:id/deadline
const updateDeadline = async (req, res) => {
  const { id } = req.params;
  const { deadline_dk } = req.body;
  if (!deadline_dk) return res.status(400).json({ message: 'Thiếu deadline_dk' });
  try {
    const { rows } = await pool.query(
      `UPDATE TuanLamViec SET deadline_dk = $1, trang_thai = 'mo' WHERE id = $2 RETURNING *`,
      [deadline_dk, id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Tuần không tồn tại' });
    return res.json(rows[0]);
  } catch (err) { return handlePgError(err, res); }
};

module.exports = { getAll, create, updateTrangThai, updateDeadline };
