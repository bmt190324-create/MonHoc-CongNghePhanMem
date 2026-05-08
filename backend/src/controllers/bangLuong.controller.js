const pool = require('../config/db');
const { handlePgError } = require('../middleware/errorHandler');

// POST /api/bang-luong/tinh-luong
const tinhLuong = async (req, res) => {
  const { thang, nam } = req.body;
  if (!thang || !nam) return res.status(400).json({ message: 'Thiếu tháng hoặc năm' });

  try {
    await pool.query(`CALL sp_tinh_luong($1, $2)`, [parseInt(thang), parseInt(nam)]);
    return res.json({ message: `Tính lương tháng ${thang}/${nam} thành công` });
  } catch (err) { return handlePgError(err, res); }
};

// GET /api/bang-luong
const getAll = async (req, res) => {
  const { thang, nam, nhan_vien_id, trang_thai } = req.query;
  let where = 'WHERE 1=1';
  const params = [];

  if (thang) { params.push(thang); where += ` AND bl.thang = $${params.length}`; }
  if (nam) { params.push(nam); where += ` AND bl.nam = $${params.length}`; }
  if (nhan_vien_id) { params.push(nhan_vien_id); where += ` AND bl.nhan_vien_id = $${params.length}`; }
  if (trang_thai) { params.push(trang_thai); where += ` AND bl.trang_thai = $${params.length}`; }

  try {
    const { rows } = await pool.query(
      `SELECT bl.*, nv.ho_ten, vt.ten_vai_tro
       FROM BangLuong bl
       JOIN NhanVien nv ON nv.id = bl.nhan_vien_id
       JOIN VaiTro vt ON vt.id = nv.vai_tro_id
       ${where}
       ORDER BY bl.nam DESC, bl.thang DESC, nv.ho_ten`,
      params
    );
    return res.json(rows);
  } catch (err) { return handlePgError(err, res); }
};

// PUT /api/bang-luong/:id/trang-thai
const updateTrangThai = async (req, res) => {
  const { id } = req.params;
  const { trang_thai } = req.body;
  const valid = ['nhap', 'da_duyet', 'da_tra'];
  if (!valid.includes(trang_thai)) return res.status(400).json({ message: 'Trạng thái không hợp lệ' });

  try {
    const { rows } = await pool.query(
      `UPDATE BangLuong SET trang_thai = $1 WHERE id = $2 RETURNING *`,
      [trang_thai, id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Bảng lương không tồn tại' });
    return res.json(rows[0]);
  } catch (err) { return handlePgError(err, res); }
};

module.exports = { tinhLuong, getAll, updateTrangThai };
