const pool = require('../config/db');
const { handlePgError } = require('../middleware/errorHandler');

// POST /api/phan-cong-ca
const create = async (req, res) => {
  const { lich_id, nhan_vien_id } = req.body;
  if (!lich_id || !nhan_vien_id) {
    return res.status(400).json({ message: 'Thiếu lich_id hoặc nhan_vien_id' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO PhanCongCa (lich_id, nhan_vien_id) VALUES ($1, $2) RETURNING *`,
      [lich_id, nhan_vien_id]
    );
    // Tạo record chấm công trống
    await client.query(
      `INSERT INTO ChamCong (phan_cong_id) VALUES ($1) ON CONFLICT DO NOTHING`,
      [rows[0].id]
    );
    await client.query('COMMIT');
    return res.status(201).json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    return handlePgError(err, res);
  } finally {
    client.release();
  }
};

// POST /api/phan-cong-ca/batch (phân công hàng loạt từ đăng ký đã duyệt)
const phanCongTuDangKy = async (req, res) => {
  const { lich_id } = req.body;
  if (!lich_id) return res.status(400).json({ message: 'Thiếu lich_id' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lấy thông tin lịch
    const { rows: lichRows } = await client.query(
      `SELECT l.tuan_id, l.khung_ca_id, l.thu_trong_tuan FROM LichLamViec l WHERE l.id = $1`,
      [lich_id]
    );
    if (!lichRows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Lịch không tồn tại' });
    }

    const lich = lichRows[0];
    const { rows: dkRows } = await client.query(
      `SELECT nhan_vien_id FROM DangKyCa
       WHERE tuan_id = $1 AND khung_ca_id = $2 AND thu_trong_tuan = $3 AND trang_thai = 'da_duyet'`,
      [lich.tuan_id, lich.khung_ca_id, lich.thu_trong_tuan]
    );

    const results = [];
    for (const dk of dkRows) {
      const { rows } = await client.query(
        `INSERT INTO PhanCongCa (lich_id, nhan_vien_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *`,
        [lich_id, dk.nhan_vien_id]
      );
      if (rows.length) {
        await client.query(`INSERT INTO ChamCong (phan_cong_id) VALUES ($1)`, [rows[0].id]);
        results.push(rows[0]);
      }
    }

    await client.query('COMMIT');
    return res.status(201).json({ message: `Phân công ${results.length} nhân viên`, data: results });
  } catch (err) {
    await client.query('ROLLBACK');
    return handlePgError(err, res);
  } finally {
    client.release();
  }
};

// GET /api/phan-cong-ca?lich_id=
const getByLich = async (req, res) => {
  const { lich_id } = req.query;
  if (!lich_id) return res.status(400).json({ message: 'Thiếu lich_id' });

  try {
    const { rows } = await pool.query(
      `SELECT pc.*, nv.ho_ten,
              cc.id as cham_cong_id, cc.gio_vao, cc.gio_ra, cc.so_gio_thuc_te,
              cc.trang_thai as trang_thai_cham_cong, cc.so_phut_tre
       FROM PhanCongCa pc
       JOIN NhanVien nv ON nv.id = pc.nhan_vien_id
       LEFT JOIN ChamCong cc ON cc.phan_cong_id = pc.id
       WHERE pc.lich_id = $1`,
      [lich_id]
    );
    return res.json(rows);
  } catch (err) { return handlePgError(err, res); }
};

// DELETE /api/phan-cong-ca/:id
const remove = async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query(`DELETE FROM PhanCongCa WHERE id = $1`, [id]);
    if (!rowCount) return res.status(404).json({ message: 'Phân công không tồn tại' });
    return res.json({ message: 'Xóa phân công thành công' });
  } catch (err) { return handlePgError(err, res); }
};

module.exports = { create, phanCongTuDangKy, getByLich, remove };
