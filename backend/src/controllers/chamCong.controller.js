const pool = require('../config/db');
const { handlePgError } = require('../middleware/errorHandler');

// GET /api/cham-cong/theo-ca/:lich_id
const theoCa = async (req, res) => {
  const { lich_id } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT cc.*, pc.nhan_vien_id, nv.ho_ten,
              l.ngay_lam, kc.ten_ca, kc.gio_bat_dau, kc.gio_ket_thuc
       FROM ChamCong cc
       JOIN PhanCongCa pc ON pc.id = cc.phan_cong_id
       JOIN NhanVien nv ON nv.id = pc.nhan_vien_id
       JOIN LichLamViec l ON l.id = pc.lich_id
       JOIN KhungCa kc ON kc.id = l.khung_ca_id
       WHERE pc.lich_id = $1
       ORDER BY nv.ho_ten`,
      [lich_id]
    );
    return res.json(rows);
  } catch (err) { return handlePgError(err, res); }
};

// PUT /api/cham-cong/:id
const update = async (req, res) => {
  const { id } = req.params;
  const { gio_vao, gio_ra, ghi_chu } = req.body;

  try {
    // Kiểm tra không cho chấm công trước ngày diễn ra ca làm
    const { rows: shiftRows } = await pool.query(
      `SELECT l.ngay_lam FROM ChamCong cc
       JOIN PhanCongCa pc ON pc.id = cc.phan_cong_id
       JOIN LichLamViec l ON l.id = pc.lich_id
       WHERE cc.id = $1`,
      [id]
    );

    if (shiftRows.length > 0) {
      const shiftDate = new Date(shiftRows[0].ngay_lam);
      shiftDate.setHours(0,0,0,0);
      const today = new Date();
      today.setHours(0,0,0,0);

      if (today < shiftDate) {
        return res.status(400).json({ message: 'Không thể chấm công cho ca làm việc trong tương lai. Vui lòng quay lại vào đúng ngày diễn ra ca làm.' });
      }
    }

    const { rows } = await pool.query(
      `UPDATE ChamCong SET gio_vao = $1, gio_ra = $2, ghi_chu = $3, nguoi_cham = $4
       WHERE id = $5 RETURNING *`,
      [gio_vao || null, gio_ra || null, ghi_chu || null, req.user.id, id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Bản ghi chấm công không tồn tại' });
    return res.json(rows[0]);
  } catch (err) { return handlePgError(err, res); }
};

// GET /api/cham-cong/lich-ca-nhan
const lichCaNhan = async (req, res) => {
  const { tuan_id } = req.query;
  const nhan_vien_id = req.user.id;
  let where = `WHERE pc.nhan_vien_id = $1`;
  const params = [nhan_vien_id];
  if (tuan_id) { params.push(tuan_id); where += ` AND l.tuan_id = $${params.length}`; }

  try {
    const { rows } = await pool.query(
      `SELECT l.ngay_lam, l.thu_trong_tuan, kc.ten_ca, kc.gio_bat_dau, kc.gio_ket_thuc,
              cc.gio_vao, cc.gio_ra, cc.so_gio_thuc_te, cc.trang_thai, cc.so_phut_tre,
              t.ngay_bat_dau, t.ngay_ket_thuc
       FROM PhanCongCa pc
       JOIN LichLamViec l ON l.id = pc.lich_id
       JOIN KhungCa kc ON kc.id = l.khung_ca_id
       JOIN TuanLamViec t ON t.id = l.tuan_id
       LEFT JOIN ChamCong cc ON cc.phan_cong_id = pc.id
       ${where}
       ORDER BY l.ngay_lam, kc.gio_bat_dau`,
      params
    );
    return res.json(rows);
  } catch (err) { return handlePgError(err, res); }
};

// GET /api/cham-cong/thu-nhap-du-kien
const thuNhapDuKien = async (req, res) => {
  const nhan_vien_id = req.user.id;
  try {
    const { rows: gioRows } = await pool.query(
      `SELECT COALESCE(SUM(cc.so_gio_thuc_te), 0) as tong_gio
       FROM ChamCong cc
       JOIN PhanCongCa pc ON pc.id = cc.phan_cong_id
       JOIN LichLamViec l ON l.id = pc.lich_id
       WHERE pc.nhan_vien_id = $1
         AND EXTRACT(MONTH FROM l.ngay_lam) = EXTRACT(MONTH FROM NOW())
         AND EXTRACT(YEAR FROM l.ngay_lam) = EXTRACT(YEAR FROM NOW())
         AND cc.trang_thai IN ('hop_le', 'di_tre')`,
      [nhan_vien_id]
    );

    const { rows: gioRows2 } = await pool.query(
      `SELECT COALESCE(SUM(4), 0) as gio_con_lai
       FROM PhanCongCa pc
       JOIN LichLamViec l ON l.id = pc.lich_id
       JOIN ChamCong cc ON cc.phan_cong_id = pc.id
       WHERE pc.nhan_vien_id = $1
         AND l.ngay_lam > NOW()::DATE
         AND EXTRACT(MONTH FROM l.ngay_lam) = EXTRACT(MONTH FROM NOW())
         AND cc.trang_thai = 'chua_cham'`,
      [nhan_vien_id]
    );

    const { rows: donGiaRows } = await pool.query(
      `SELECT don_gia_gio FROM CauHinhLuong ORDER BY ngay_ap_dung DESC LIMIT 1`
    );
    const donGia = donGiaRows[0]?.don_gia_gio || 0;
    const tongGioThucTe = parseFloat(gioRows[0].tong_gio);
    const gioConLai = parseFloat(gioRows2[0].gio_con_lai);

    return res.json({
      tong_gio_thuc_te: tongGioThucTe,
      gio_con_lai: gioConLai,
      don_gia_gio: donGia,
      thu_nhap_thuc_te: tongGioThucTe * donGia,
      thu_nhap_du_kien: (tongGioThucTe + gioConLai) * donGia,
    });
  } catch (err) { return handlePgError(err, res); }
};

module.exports = { theoCa, update, lichCaNhan, thuNhapDuKien };
