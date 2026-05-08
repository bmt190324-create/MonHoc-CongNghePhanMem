const pool = require('../config/db');
const { handlePgError } = require('../middleware/errorHandler');

// POST /api/lich-lam-viec
const create = async (req, res) => {
  const { tuan_id, khung_ca_id, thu_trong_tuan, ngay_lam } = req.body;
  if (!tuan_id || !khung_ca_id || !thu_trong_tuan || !ngay_lam) {
    return res.status(400).json({ message: 'Thiếu thông tin lịch làm việc' });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO LichLamViec (tuan_id, khung_ca_id, thu_trong_tuan, ngay_lam)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [tuan_id, khung_ca_id, thu_trong_tuan, ngay_lam]
    );
    return res.status(201).json(rows[0]);
  } catch (err) { return handlePgError(err, res); }
};

// POST /api/lich-lam-viec/tao-tu-dang-ky
const taoTuDangKy = async (req, res) => {
  const { tuan_id } = req.body;
  if (!tuan_id) return res.status(400).json({ message: 'Thiếu tuan_id' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lấy tất cả đăng ký đã duyệt của tuần
    const { rows: dkRows } = await client.query(
      `SELECT DISTINCT dk.khung_ca_id, dk.thu_trong_tuan, t.ngay_bat_dau
       FROM DangKyCa dk
       JOIN TuanLamViec t ON t.id = dk.tuan_id
       WHERE dk.tuan_id = $1 AND dk.trang_thai = 'da_duyet'`,
      [tuan_id]
    );

    const created = [];
    for (const row of dkRows) {
      const daysOffset = row.thu_trong_tuan - 2; // Thu 2 = offset 0
      const ngayLam = new Date(row.ngay_bat_dau);
      ngayLam.setDate(ngayLam.getDate() + daysOffset);
      const ngayLamStr = ngayLam.toISOString().split('T')[0];

      // Kiểm tra xem đã tồn tại chưa
      const exist = await client.query(
        `SELECT id FROM LichLamViec WHERE tuan_id = $1 AND khung_ca_id = $2 AND thu_trong_tuan = $3`,
        [tuan_id, row.khung_ca_id, row.thu_trong_tuan]
      );
      if (exist.rowCount > 0) { created.push(exist.rows[0]); continue; }

      const { rows: lichRows } = await client.query(
        `INSERT INTO LichLamViec (tuan_id, khung_ca_id, thu_trong_tuan, ngay_lam)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [tuan_id, row.khung_ca_id, row.thu_trong_tuan, ngayLamStr]
      );
      created.push(lichRows[0]);
    }

    await client.query('COMMIT');
    return res.status(201).json({ message: `Tạo ${created.length} lịch làm việc thành công`, data: created });
  } catch (err) {
    await client.query('ROLLBACK');
    return handlePgError(err, res);
  } finally {
    client.release();
  }
};

// GET /api/lich-lam-viec
const getAll = async (req, res) => {
  const { tuan_id } = req.query;
  let where = 'WHERE 1=1';
  const params = [];
  if (tuan_id) { params.push(tuan_id); where += ` AND l.tuan_id = $${params.length}`; }

  try {
    const { rows } = await pool.query(
      `SELECT l.*, kc.ten_ca, kc.gio_bat_dau, kc.gio_ket_thuc,
              t.ngay_bat_dau, t.ngay_ket_thuc,
              (SELECT COUNT(*) FROM PhanCongCa pc WHERE pc.lich_id = l.id) as so_nv_phan_cong
       FROM LichLamViec l
       JOIN KhungCa kc ON kc.id = l.khung_ca_id
       JOIN TuanLamViec t ON t.id = l.tuan_id
       ${where}
       ORDER BY l.ngay_lam, kc.gio_bat_dau`,
      params
    );
    return res.json(rows);
  } catch (err) { return handlePgError(err, res); }
};

module.exports = { create, taoTuDangKy, getAll };
