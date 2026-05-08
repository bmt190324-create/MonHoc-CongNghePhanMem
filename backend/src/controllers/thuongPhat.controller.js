const pool = require('../config/db');
const { handlePgError } = require('../middleware/errorHandler');

// GET /api/thuong-phat
const getAll = async (req, res) => {
  const { nhan_vien_id, thang, nam } = req.query;
  let where = 'WHERE 1=1';
  const params = [];

  if (nhan_vien_id) { params.push(nhan_vien_id); where += ` AND tp.nhan_vien_id = $${params.length}`; }
  if (thang) { params.push(thang); where += ` AND EXTRACT(MONTH FROM tp.ngay) = $${params.length}`; }
  if (nam) { params.push(nam); where += ` AND EXTRACT(YEAR FROM tp.ngay) = $${params.length}`; }

  try {
    const { rows } = await pool.query(
      `SELECT tp.*, nv.ho_ten, nv2.ho_ten as nguoi_tao_ten
       FROM ThuongPhat tp
       JOIN NhanVien nv ON nv.id = tp.nhan_vien_id
       LEFT JOIN NhanVien nv2 ON nv2.id = tp.nguoi_tao
       ${where} ORDER BY tp.ngay DESC`,
      params
    );
    return res.json(rows);
  } catch (err) { return handlePgError(err, res); }
};

// POST /api/thuong-phat
const create = async (req, res) => {
  const { nhan_vien_id, ngay, loai, so_tien, ly_do } = req.body;
  if (!nhan_vien_id || !ngay || !loai || !so_tien) {
    return res.status(400).json({ message: 'Thiếu thông tin thưởng/phạt' });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO ThuongPhat (nhan_vien_id, ngay, loai, so_tien, ly_do, nguoi_tao)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [nhan_vien_id, ngay, loai, so_tien, ly_do || null, req.user.id]
    );
    return res.status(201).json(rows[0]);
  } catch (err) { return handlePgError(err, res); }
};

// DELETE /api/thuong-phat/:id
const remove = async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query(`DELETE FROM ThuongPhat WHERE id = $1`, [id]);
    if (!rowCount) return res.status(404).json({ message: 'Không tìm thấy khoản thưởng/phạt' });
    return res.json({ message: 'Xóa thành công' });
  } catch (err) { return handlePgError(err, res); }
};

module.exports = { getAll, create, remove };
