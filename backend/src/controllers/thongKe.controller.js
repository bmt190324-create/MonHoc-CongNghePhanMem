const pool = require('../config/db');
const { handlePgError } = require('../middleware/errorHandler');

// GET /api/thong-ke/chi-phi-luong?nam=2026&ky=thang|quy|nam
const chiPhiLuong = async (req, res) => {
  const { nam, ky = 'thang' } = req.query;
  const namVal = parseInt(nam) || new Date().getFullYear();

  try {
    let query;
    if (ky === 'thang') {
      query = await pool.query(
        `SELECT bl.thang, bl.nam,
                SUM(bl.tong_luong) as tong_chi_phi,
                SUM(bl.luong_co_ban) as tong_luong_co_ban,
                SUM(bl.tong_thuong_phat) as tong_thuong_phat,
                COUNT(DISTINCT bl.nhan_vien_id) as so_nhan_vien
         FROM BangLuong bl
         WHERE bl.nam = $1
         GROUP BY bl.thang, bl.nam
         ORDER BY bl.thang`,
        [namVal]
      );
    } else if (ky === 'quy') {
      query = await pool.query(
        `SELECT CEIL(bl.thang / 3.0) as quy, bl.nam,
                SUM(bl.tong_luong) as tong_chi_phi,
                COUNT(DISTINCT bl.nhan_vien_id) as so_nhan_vien
         FROM BangLuong bl
         WHERE bl.nam = $1
         GROUP BY CEIL(bl.thang / 3.0), bl.nam
         ORDER BY quy`,
        [namVal]
      );
    } else {
      query = await pool.query(
        `SELECT bl.nam,
                SUM(bl.tong_luong) as tong_chi_phi,
                COUNT(DISTINCT bl.nhan_vien_id) as so_nhan_vien
         FROM BangLuong bl
         WHERE bl.nam BETWEEN $1 - 2 AND $1
         GROUP BY bl.nam
         ORDER BY bl.nam`,
        [namVal]
      );
    }
    return res.json(query.rows);
  } catch (err) { return handlePgError(err, res); }
};

// GET /api/thong-ke/nhan-su-ca?thang=4&nam=2026
const nhanSuCa = async (req, res) => {
  const { thang, nam, tuan_id } = req.query;
  let where = 'WHERE 1=1';
  const params = [];

  if (tuan_id) { 
    params.push(tuan_id); 
    where += ` AND l.tuan_id = $${params.length}`; 
  } else if (thang && nam) {
    params.push(parseInt(thang));
    where += ` AND EXTRACT(MONTH FROM l.ngay_lam) = $${params.length}`;
    params.push(parseInt(nam));
    where += ` AND EXTRACT(YEAR FROM l.ngay_lam) = $${params.length}`;
  }

  try {
    const { rows } = await pool.query(
      `SELECT kc.ten_ca, COALESCE(summary.so_nv_phan_cong, 0) as so_nv_phan_cong
       FROM KhungCa kc
       LEFT JOIN (
          SELECT kc2.id, COUNT(pc.id) as so_nv_phan_cong
          FROM LichLamViec l
          JOIN KhungCa kc2 ON kc2.id = l.khung_ca_id
          LEFT JOIN PhanCongCa pc ON pc.lich_id = l.id
          ${where}
          GROUP BY kc2.id
       ) summary ON summary.id = kc.id
       ORDER BY kc.id`,
      params
    );
    return res.json(rows);
  } catch (err) { return handlePgError(err, res); }
};

// GET /api/thong-ke/tong-quan
// GET /api/thong-ke/tong-quan?thang=4&nam=2026
const tongQuan = async (req, res) => {
  const { thang, nam } = req.query;
  const m = parseInt(thang) || new Date().getMonth() + 1;
  const y = parseInt(nam) || new Date().getFullYear();

  try {
    const [nvRows, tuanRows, chamCongRows, luongRows] = await Promise.all([
      pool.query(`SELECT COUNT(*) as total, SUM(CASE WHEN trang_thai THEN 1 ELSE 0 END) as hoat_dong FROM NhanVien`),
      pool.query(`SELECT COUNT(*) as total FROM TuanLamViec WHERE trang_thai = 'mo'`),
      pool.query(`SELECT COUNT(*) as total FROM ChamCong WHERE trang_thai = 'chua_cham'`),
      pool.query(
        `SELECT 
            COALESCE(SUM(tong_luong), 0) as total_luong,
            COALESCE(SUM(tong_gio_lam), 0) as total_gio
         FROM BangLuong 
         WHERE thang = $1 AND nam = $2`, [m, y]
      ),
    ]);

    return res.json({
      tong_nhan_vien: parseInt(nvRows.rows[0].total),
      nhan_vien_hoat_dong: parseInt(nvRows.rows[0].hoat_dong),
      tuan_dang_mo: parseInt(tuanRows.rows[0].total),
      chua_cham_cong: parseInt(chamCongRows.rows[0].total),
      tong_chi_phi_luong: parseFloat(luongRows.rows[0].total_luong),
      tong_gio_lam: parseFloat(luongRows.rows[0].total_gio),
    });
  } catch (err) { return handlePgError(err, res); }
};

module.exports = { chiPhiLuong, nhanSuCa, tongQuan };
