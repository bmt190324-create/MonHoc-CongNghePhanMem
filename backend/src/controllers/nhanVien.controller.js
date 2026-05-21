const pool = require('../config/db');
const { handlePgError } = require('../middleware/errorHandler');

// GET /api/nhan-vien
const getAll = async (req, res) => {
  const { vai_tro, trang_thai } = req.query;
  let where = 'WHERE 1=1';
  const params = [];

  if (vai_tro) { params.push(vai_tro); where += ` AND vt.ten_vai_tro = $${params.length}`; }
  if (trang_thai !== undefined) { params.push(trang_thai === 'true'); where += ` AND nv.trang_thai = $${params.length}`; }

  try {
    const { rows } = await pool.query(
      `SELECT nv.id, nv.ho_ten, nv.the_sinh_vien, nv.trang_thai, nv.ngay_tao,
              vt.ten_vai_tro, vt.id as vai_tro_id,
              tk.ten_dang_nhap, tk.bi_khoa, tk.lan_dang_nhap_cuoi, tk.so_lan_sai
       FROM NhanVien nv
       JOIN VaiTro vt ON vt.id = nv.vai_tro_id
       LEFT JOIN TaiKhoan tk ON tk.nhan_vien_id = nv.id
       ${where}
       ORDER BY nv.id`,
      params
    );
    return res.json(rows);
  } catch (err) { return handlePgError(err, res); }
};

// POST /api/nhan-vien
const create = async (req, res) => {
  const { ho_ten, cccd, the_sinh_vien, so_tai_khoan, vai_tro_id, ten_dang_nhap, mat_khau } = req.body;
  if (!ho_ten || !vai_tro_id || !ten_dang_nhap || !mat_khau) {
    return res.status(400).json({ message: 'Thiếu thông tin bắt buộc: ho_ten, vai_tro_id, ten_dang_nhap, mat_khau' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const encKey = process.env.ENCRYPT_KEY;
    const { rows } = await client.query(
      `INSERT INTO NhanVien (ho_ten, cccd, the_sinh_vien, so_tai_khoan, vai_tro_id)
       VALUES ($1, pgp_sym_encrypt($2::text, $3), $4, pgp_sym_encrypt($5::text, $3), $6)
       RETURNING id, ho_ten, trang_thai, ngay_tao`,
      [ho_ten, cccd || '', encKey, the_sinh_vien || null, so_tai_khoan || '', vai_tro_id]
    );

    const nv = rows[0];
    const bcrypt = require('bcrypt');
    const hash = await bcrypt.hash(mat_khau, 12);
    await client.query(
      `INSERT INTO TaiKhoan (nhan_vien_id, ten_dang_nhap, mat_khau_hash) VALUES ($1, $2, $3)`,
      [nv.id, ten_dang_nhap, hash]
    );

    await client.query('COMMIT');
    return res.status(201).json({ message: 'Thêm nhân viên thành công', nhanVien: nv });
  } catch (err) {
    await client.query('ROLLBACK');
    return handlePgError(err, res);
  } finally {
    client.release();
  }
};

// PUT /api/nhan-vien/:id
const update = async (req, res) => {
  const { id } = req.params;
  const { ho_ten, the_sinh_vien, vai_tro_id } = req.body;
  
  try {
    // Kiểm tra nếu đang cố gắng đổi vai trò của CST duy nhất
    if (vai_tro_id && parseInt(vai_tro_id) !== 1) {
        const { rows: currentNv } = await pool.query('SELECT vai_tro_id, trang_thai FROM NhanVien WHERE id = $1', [id]);
        if (currentNv.length && currentNv[0].vai_tro_id === 1 && currentNv[0].trang_thai) {
            const { rows: cstCount } = await pool.query('SELECT COUNT(*) FROM NhanVien WHERE vai_tro_id = 1 AND trang_thai = TRUE');
            if (parseInt(cstCount[0].count) <= 1) {
                return res.status(400).json({ message: 'Không thể thay đổi vai trò của Chủ siêu thị duy nhất đang hoạt động.' });
            }
        }
    }

    const { rows } = await pool.query(
      `UPDATE NhanVien SET ho_ten = COALESCE($1, ho_ten),
              the_sinh_vien = COALESCE($2, the_sinh_vien),
              vai_tro_id = COALESCE($3, vai_tro_id)
       WHERE id = $4 RETURNING id, ho_ten, trang_thai`,
      [ho_ten, the_sinh_vien, vai_tro_id, id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Nhân viên không tồn tại' });
    return res.json({ message: 'Cập nhật thành công', nhanVien: rows[0] });
  } catch (err) { return handlePgError(err, res); }
};

// DELETE /api/nhan-vien/:id (soft delete + lock account)
const remove = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Kiểm tra nếu là CST duy nhất
    const { rows: currentNv } = await client.query('SELECT vai_tro_id, trang_thai FROM NhanVien WHERE id = $1', [id]);
    if (currentNv.length && currentNv[0].vai_tro_id === 1 && currentNv[0].trang_thai) {
        const { rows: cstCount } = await client.query('SELECT COUNT(*) FROM NhanVien WHERE vai_tro_id = 1 AND trang_thai = TRUE');
        if (parseInt(cstCount[0].count) <= 1) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Không thể vô hiệu hóa Chủ siêu thị duy nhất đang hoạt động.' });
        }
    }

    // 1. Vô hiệu hóa nhân viên
    const { rowCount } = await client.query(
      `UPDATE NhanVien SET trang_thai = FALSE, ngay_vo_hieu_hoa = NOW() WHERE id = $1`, [id]
    );

    if (!rowCount) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'Nhân viên không tồn tại' });
    }

    // 2. Khóa tài khoản
    await client.query(
        `UPDATE TaiKhoan SET bi_khoa = TRUE WHERE nhan_vien_id = $1`, [id]
    );

    await client.query('COMMIT');
    return res.json({ message: 'Đã hoàn tất quy trình cho nhân viên nghỉ việc' });
  } catch (err) {
    await client.query('ROLLBACK');
    return handlePgError(err, res);
  } finally {
    client.release();
  }
};

// GET /api/nhan-vien/:id
const getById = async (req, res) => {
  const { id } = req.params;
  try {
    const encKey = process.env.ENCRYPT_KEY;
    const { rows } = await pool.query(
      `SELECT nv.id, nv.ho_ten, nv.the_sinh_vien, nv.trang_thai, nv.ngay_tao,
              pgp_sym_decrypt(nv.cccd::bytea, $2) as cccd,
              pgp_sym_decrypt(nv.so_tai_khoan::bytea, $2) as so_tai_khoan,
              vt.ten_vai_tro, vt.id as vai_tro_id,
              tk.ten_dang_nhap, tk.bi_khoa
       FROM NhanVien nv
       JOIN VaiTro vt ON vt.id = nv.vai_tro_id
       LEFT JOIN TaiKhoan tk ON tk.nhan_vien_id = nv.id
       WHERE nv.id = $1`,
      [id, encKey]
    );
    if (!rows.length) return res.status(404).json({ message: 'Nhân viên không tồn tại' });
    return res.json(rows[0]);
  } catch (err) { return handlePgError(err, res); }
};

// GET /api/nhan-vien/me/thu-nhap
const getMyIncome = async (req, res) => {
  const nhan_vien_id = req.user.id;
  try {
    // 1. Lấy đơn giá lương mới nhất áp dụng cho hiện tại
    const { rows: chlRows } = await pool.query(
      `SELECT don_gia_gio FROM CauHinhLuong 
       WHERE ngay_ap_dung <= CURRENT_DATE 
       ORDER BY ngay_ap_dung DESC LIMIT 1`
    );
    const don_gia = chlRows.length > 0 ? parseFloat(chlRows[0].don_gia_gio) : 0;

    // 2. Tính tổng giờ làm trong tháng hiện tại (chỉ tính ca đã hoàn thành và hợp lệ/đi trễ)
    const { rows: incomeRows } = await pool.query(
      `SELECT 
        COALESCE(SUM(cc.so_gio_thuc_te), 0) as tong_gio,
        COUNT(cc.id) as tong_ca
       FROM ChamCong cc
       JOIN PhanCongCa pc ON pc.id = cc.phan_cong_id
       JOIN LichLamViec l ON l.id = pc.lich_id
       WHERE pc.nhan_vien_id = $1
         AND cc.trang_thai IN ('hop_le', 'di_tre')
         AND EXTRACT(MONTH FROM l.ngay_lam) = EXTRACT(MONTH FROM CURRENT_DATE)
         AND EXTRACT(YEAR FROM l.ngay_lam) = EXTRACT(YEAR FROM CURRENT_DATE)`,
      [nhan_vien_id]
    );

    const { tong_gio, tong_ca } = incomeRows[0];
    const thu_nhap = parseFloat(tong_gio) * don_gia;

    return res.json({
      tong_gio: parseFloat(tong_gio),
      tong_ca: parseInt(tong_ca),
      don_gia,
      thu_nhap,
      thang: new Date().getMonth() + 1,
      nam: new Date().getFullYear()
    });
  } catch (err) { return handlePgError(err, res); }
};

// GET /api/nhan-vien/me/next-shift
const getNextShift = async (req, res) => {
  const nhan_vien_id = req.user.id;
  try {
    const { rows } = await pool.query(
      `SELECT l.ngay_lam, kc.ten_ca, kc.gio_bat_dau, kc.gio_ket_thuc
       FROM PhanCongCa pc
       JOIN LichLamViec l ON l.id = pc.lich_id
       JOIN KhungCa kc ON kc.id = l.khung_ca_id
       WHERE pc.nhan_vien_id = $1
         AND (l.ngay_lam > CURRENT_DATE OR (l.ngay_lam = CURRENT_DATE AND kc.gio_bat_dau > CURRENT_TIME))
         -- Đảm bảo ca này thực sự đã được phê duyệt trong bảng DangKyCa
         AND EXISTS (
           SELECT 1 FROM DangKyCa dk 
           WHERE dk.nhan_vien_id = pc.nhan_vien_id 
             AND dk.tuan_id = l.tuan_id 
             AND dk.khung_ca_id = l.khung_ca_id 
             AND dk.thu_trong_tuan = l.thu_trong_tuan 
             AND dk.trang_thai = 'da_duyet'
         )
       ORDER BY l.ngay_lam ASC, kc.gio_bat_dau ASC
       LIMIT 1`,
      [nhan_vien_id]
    );
    return res.json(rows[0] || null);
  } catch (err) { return handlePgError(err, res); }
};

// PATCH /api/nhan-vien/:id/restore (activate + unlock account)
const restore = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Phục hồi trạng thái nhân viên
    await client.query(`UPDATE NhanVien SET trang_thai = TRUE, ngay_vo_hieu_hoa = NULL WHERE id = $1`, [id]);

    // 2. Mở khóa tài khoản
    await client.query(`UPDATE TaiKhoan SET bi_khoa = FALSE WHERE nhan_vien_id = $1`, [id]);

    await client.query('COMMIT');
    return res.json({ message: 'Đã khôi phục nhân viên thành công' });
  } catch (err) {
    await client.query('ROLLBACK');
    return handlePgError(err, res);
  } finally {
    client.release();
  }
};

// GET /api/nhan-vien/me/profile
const getProfile = async (req, res) => {
  const id = req.user.id;
  try {
    const encKey = process.env.ENCRYPT_KEY;
    const { rows } = await pool.query(
      `SELECT nv.id, nv.ho_ten, nv.the_sinh_vien, nv.trang_thai, nv.ngay_tao,
              pgp_sym_decrypt(nv.cccd::bytea, $2) as cccd,
              pgp_sym_decrypt(nv.so_tai_khoan::bytea, $2) as so_tai_khoan,
              vt.ten_vai_tro, vt.id as vai_tro_id,
              tk.ten_dang_nhap
       FROM NhanVien nv
       JOIN VaiTro vt ON vt.id = nv.vai_tro_id
       LEFT JOIN TaiKhoan tk ON tk.nhan_vien_id = nv.id
       WHERE nv.id = $1`,
      [id, encKey]
    );
    if (!rows.length) return res.status(404).json({ message: 'Nhân viên không tồn tại' });
    return res.json(rows[0]);
  } catch (err) { return handlePgError(err, res); }
};

// PUT /api/nhan-vien/me/profile
const updateProfile = async (req, res) => {
  const id = req.user.id;
  const { ho_ten, cccd, the_sinh_vien, so_tai_khoan } = req.body;
  const encKey = process.env.ENCRYPT_KEY;
  
  try {
    const { rows } = await pool.query(
      `UPDATE NhanVien SET 
              ho_ten = COALESCE($1, ho_ten),
              cccd = CASE WHEN $2::text IS NOT NULL THEN pgp_sym_encrypt($2::text, $5)::text ELSE cccd END,
              the_sinh_vien = COALESCE($3, the_sinh_vien),
              so_tai_khoan = CASE WHEN $4::text IS NOT NULL THEN pgp_sym_encrypt($4::text, $5)::text ELSE so_tai_khoan END
       WHERE id = $6 RETURNING id, ho_ten`,
      [ho_ten || null, cccd || null, the_sinh_vien || null, so_tai_khoan || null, encKey, id]
    );
    return res.json({ message: 'Cập nhật thông tin cá nhân thành công', nhanVien: rows[0] });
  } catch (err) { return handlePgError(err, res); }
};

// GET /api/nhan-vien/finance (cho bản thân hoặc cho quản lý xem NV)
const getFinance = async (req, res) => {
  const query_id = req.query.nhan_vien_id;
  const target_id = query_id || req.user.id;
  
  // Bảo mật: Nếu xem cho người khác, phải là CST hoặc QLC
  if (query_id && query_id.toString() !== req.user.id.toString()) {
    if (req.user.vai_tro !== 'CST' && req.user.vai_tro !== 'QLC') {
      return res.status(403).json({ message: 'Bạn không có quyền xem thông tin tài chính của người khác' });
    }
  }

  const currentYear = new Date().getFullYear();
  
  try {
    // 1. Lấy lịch sử lương từng tháng trong năm hiện tại
    let salaryHistory = [];
    try {
      const { rows } = await pool.query(
        `SELECT thang, nam, tong_luong, trang_thai, ngay_tao
         FROM BangLuong 
         WHERE nhan_vien_id = $1 AND nam = $2
         ORDER BY thang ASC`,
        [target_id, currentYear]
      );
      salaryHistory = rows;
    } catch (e) { console.error('History Query Error:', e.message); }

    // 2. Lấy tổng thưởng - phạt (loai: 'thuong' / 'phat')
    let bonusPenalty = { tong_thuong: 0, tong_phat: 0 };
    try {
      const { rows } = await pool.query(
        `SELECT 
          COALESCE(SUM(CASE WHEN loai = 'thuong' THEN so_tien ELSE 0 END), 0) as tong_thuong,
          COALESCE(SUM(CASE WHEN loai = 'phat' THEN so_tien ELSE 0 END), 0) as tong_phat
         FROM ThuongPhat 
         WHERE nhan_vien_id = $1`,
        [target_id]
      );
      if (rows.length) bonusPenalty = rows[0];
    } catch (e) { console.error('Bonus Query Error:', e.message); }

    // 3. Tính tổng thu nhập thực tế (các bảng lương đã trả)
    let totalIncome = 0;
    try {
      const { rows } = await pool.query(
        `SELECT COALESCE(SUM(tong_luong), 0) as tong_da_nhan
         FROM BangLuong 
         WHERE nhan_vien_id = $1 AND trang_thai = 'da_tra'`,
        [target_id]
      );
      if (rows.length) totalIncome = rows[0].tong_da_nhan;
    } catch (e) { console.error('Total Query Error:', e.message); }

    return res.json({
      year: currentYear,
      salaryHistory,
      summary: {
        tong_thuong: parseFloat(bonusPenalty.tong_thuong),
        tong_phat: parseFloat(bonusPenalty.tong_phat),
        tong_da_nhan: parseFloat(totalIncome)
      }
    });
  } catch (err) { 
    return res.status(500).json({ message: 'Lỗi server: ' + err.message }); 
  }
};

module.exports = { getAll, create, update, remove, getById, getMyIncome, getNextShift, restore, getProfile, updateProfile, getFinance };
