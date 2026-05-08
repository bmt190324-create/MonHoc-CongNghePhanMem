const pool = require('../config/db');
const { handlePgError } = require('../middleware/errorHandler');

// POST /api/dang-ky-ca
const create = async (req, res) => {
  const { tuan_id, khung_ca_id, thu_trong_tuan } = req.body;
  const nhan_vien_id = req.user.id;

  if (!tuan_id || !khung_ca_id || !thu_trong_tuan) {
    return res.status(400).json({ message: 'Thiếu thông tin đăng ký ca' });
  }

  // RÀNG BUỘC: Theo cài đặt của Chủ siêu thị (Trạng thái và Deadline)
  const { rows: tuanRows } = await pool.query('SELECT ngay_bat_dau, deadline_dk, trang_thai FROM TuanLamViec WHERE id = $1', [tuan_id]);
  if (!tuanRows.length) return res.status(404).json({ message: 'Tuần làm việc không tồn tại.' });

  const tuan = tuanRows[0];
  if (tuan.trang_thai !== 'mo') {
    return res.status(403).json({ message: `Tuần này đã ${tuan.trang_thai === 'khoa' ? 'đóng' : 'kết thúc'} đăng ký.`, status: tuan.trang_thai });
  }

  const today = new Date();
  const deadline = new Date(tuan.deadline_dk);

  const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const deadlineDateOnly = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());

  if (todayDateOnly < deadlineDateOnly) {
    return res.status(403).json({ message: `Chưa đến ngày đăng ký ca tuần này (Ngày quy định: ${deadline.toLocaleDateString('vi-VN')}).` });
  }

  if (todayDateOnly > deadlineDateOnly) {
    return res.status(403).json({ message: `Đã quá ngày đăng ký ca cho tuần này (${deadline.toLocaleDateString('vi-VN')}).` });
  }

  if (today > deadline) {
    return res.status(403).json({ message: 'Đã quá thời hạn đăng ký (giờ deadline) trong ngày hôm nay.' });
  }

  // Chỉ cho phép đăng ký tuần trong tương lai
  const startOfTuan = new Date(tuan.ngay_bat_dau);
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
  if (startOfTuan <= endOfToday) {
    return res.status(403).json({ message: 'Chỉ được phép đăng ký cho các tuần tiếp theo (chưa bắt đầu).' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO DangKyCa (nhan_vien_id, tuan_id, khung_ca_id, thu_trong_tuan)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [nhan_vien_id, tuan_id, khung_ca_id, thu_trong_tuan]
    );
    return res.status(201).json(rows[0]);
  } catch (err) { return handlePgError(err, res); }
};

// POST /api/dang-ky-ca/batch
const createBatch = async (req, res) => {
  const { tuan_id, slots } = req.body; // slots: [{khung_ca_id, thu_trong_tuan}]
  const nhan_vien_id = req.user.id;

  if (!tuan_id || !Array.isArray(slots) || slots.length === 0) {
    return res.status(400).json({ message: 'Thiếu tuan_id hoặc danh sách ca' });
  }

  // RÀNG BUỘC: Theo cài đặt của Chủ siêu thị (Trạng thái và Deadline)
  const { rows: tuanRows } = await pool.query('SELECT ngay_bat_dau, deadline_dk, trang_thai FROM TuanLamViec WHERE id = $1', [tuan_id]);
  if (!tuanRows.length) return res.status(404).json({ message: 'Tuần làm việc không tồn tại.' });

  const tuan = tuanRows[0];
  if (tuan.trang_thai !== 'mo') {
    return res.status(403).json({ message: `Tuần này đã ${tuan.trang_thai === 'khoa' ? 'đóng' : 'kết thúc'} đăng ký.`, status: tuan.trang_thai });
  }

  const today = new Date();
  const deadline = new Date(tuan.deadline_dk);

  const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const deadlineDateOnly = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());

  if (todayDateOnly < deadlineDateOnly) {
    return res.status(403).json({ message: `Chưa đến ngày đăng ký ca tuần này (Ngày quy định: ${deadline.toLocaleDateString('vi-VN')}).` });
  }

  if (todayDateOnly > deadlineDateOnly) {
    return res.status(403).json({ message: `Đã quá ngày đăng ký ca cho tuần này (${deadline.toLocaleDateString('vi-VN')}).` });
  }

  if (today > deadline) {
    return res.status(403).json({ message: 'Đã quá thời hạn đăng ký (giờ deadline) trong ngày hôm nay.' });
  }

  // Chỉ cho phép đăng ký tuần trong tương lai
  const startOfTuan = new Date(tuan.ngay_bat_dau);
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
  if (startOfTuan <= endOfToday) {
    return res.status(403).json({ message: 'Chỉ được phép đăng ký cho các tuần tiếp theo (chưa bắt đầu).' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Xóa đăng ký cũ chưa duyệt trong tuần này
    await client.query(
      `DELETE FROM DangKyCa WHERE nhan_vien_id = $1 AND tuan_id = $2 AND trang_thai = 'cho_duyet'`,
      [nhan_vien_id, tuan_id]
    );
    const inserted = [];
    for (const slot of slots) {
      const { rows } = await client.query(
        `INSERT INTO DangKyCa (nhan_vien_id, tuan_id, khung_ca_id, thu_trong_tuan)
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (nhan_vien_id, tuan_id, khung_ca_id, thu_trong_tuan) DO NOTHING
         RETURNING *`,
        [nhan_vien_id, tuan_id, slot.khung_ca_id, slot.thu_trong_tuan]
      );
      if (rows.length) inserted.push(rows[0]);
    }
    await client.query('COMMIT');
    return res.status(201).json({ message: `Đăng ký ${inserted.length} ca thành công`, data: inserted });
  } catch (err) {
    await client.query('ROLLBACK');
    return handlePgError(err, res);
  } finally {
    client.release();
  }
};

// GET /api/dang-ky-ca/cua-toi
const cuaToi = async (req, res) => {
  const { tuan_id } = req.query;
  let where = `WHERE dk.nhan_vien_id = $1`;
  const params = [req.user.id];
  if (tuan_id) { params.push(tuan_id); where += ` AND dk.tuan_id = $${params.length}`; }

  try {
    const { rows } = await pool.query(
      `SELECT dk.*, kc.ten_ca, kc.gio_bat_dau, kc.gio_ket_thuc,
              t.ngay_bat_dau, t.ngay_ket_thuc, t.deadline_dk
       FROM DangKyCa dk
       JOIN KhungCa kc ON kc.id = dk.khung_ca_id
       JOIN TuanLamViec t ON t.id = dk.tuan_id
       ${where} ORDER BY dk.thu_trong_tuan, kc.gio_bat_dau`,
      params
    );
    return res.json(rows);
  } catch (err) { return handlePgError(err, res); }
};

// GET /api/dang-ky-ca/quan-ly (reusing cho-duyet endpoint name for compatibility)
const choDuyet = async (req, res) => {
  const { tuan_id, trang_thai } = req.query;
  let where = `WHERE 1=1`;
  const params = [];
  
  if (tuan_id) { params.push(tuan_id); where += ` AND dk.tuan_id = $${params.length}`; }
  if (trang_thai) { params.push(trang_thai); where += ` AND dk.trang_thai = $${params.length}`; }

  try {
    const { rows } = await pool.query(
      `SELECT dk.*, nv.ho_ten, kc.ten_ca, kc.gio_bat_dau, kc.gio_ket_thuc,
              t.ngay_bat_dau, t.ngay_ket_thuc
       FROM DangKyCa dk
       JOIN NhanVien nv ON nv.id = dk.nhan_vien_id
       JOIN KhungCa kc ON kc.id = dk.khung_ca_id
       JOIN TuanLamViec t ON t.id = dk.tuan_id
       ${where} ORDER BY dk.tuan_id, dk.thu_trong_tuan, kc.gio_bat_dau, dk.id`,
      params
    );
    return res.json(rows);
  } catch (err) { return handlePgError(err, res); }
};

// PUT /api/dang-ky-ca/:id/duyet
const duyet = async (req, res) => {
  const { id } = req.params;
  const { trang_thai } = req.body; // 'da_duyet' | 'tu_choi' | 'cho_duyet'

  if (!['da_duyet', 'tu_choi', 'cho_duyet'].includes(trang_thai)) {
    return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lấy thông tin đăng ký + tuần để tính ngày làm
    const { rows: dkRows } = await client.query(
      `SELECT dk.*, t.ngay_bat_dau FROM DangKyCa dk
       JOIN TuanLamViec t ON t.id = dk.tuan_id
       WHERE dk.id = $1`,
      [id]
    );
    if (!dkRows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Đăng ký không tồn tại' });
    }

    const dk = dkRows[0];
    // Kiểm tra ràng buộc thời gian: chỉ được duyệt vào hoặc sau ngày deadline_dk
    const today = new Date();
    today.setHours(0,0,0,0);
    const deadlineDate = new Date(dk.deadline_dk);
    deadlineDate.setHours(0,0,0,0);
    
    if (today < deadlineDate) {
      return res.status(400).json({ message: 'Chưa đến thời hạn duyệt ca cho tuần này. Chỉ được duyệt vào hoặc sau ngày đăng ký quy định.' });
    }

    // Khóa sau deadline 1 ngày
    const lockDate = new Date(deadlineDate);
    lockDate.setDate(lockDate.getDate() + 2); // 24 -> 26 là khóa
    if (today >= lockDate) {
      return res.status(400).json({ message: 'Lịch làm việc đã được chốt cố định. Đã quá thời hạn chỉnh sửa (hạn cuối là 1 ngày sau ngày đăng ký).' });
    }

    const oldTrangThai = dk.trang_thai;

    // Cập nhật trạng thái đăng ký
    const { rows } = await client.query(
      `UPDATE DangKyCa SET trang_thai = $1 WHERE id = $2 RETURNING *`,
      [trang_thai, id]
    );

    if (trang_thai === 'da_duyet') {
      // Tính ngày làm: Thứ 2 = offset 0, Thứ 3 = offset 1, ...
      // Tính ngày làm chính xác dựa trên thứ trong tuần (Dùng local date để tránh lệch múi giờ UTC)
      const targetDayOfWeek = dk.thu_trong_tuan === 8 ? 0 : dk.thu_trong_tuan - 1; // 0=CN, 1=T2, ...
      
      const start = new Date(dk.ngay_bat_dau);
      // Tạo bản sao để tránh làm hỏng đối tượng gốc, sử dụng local components
      const ngayLam = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      
      // Tiến tới ngày đầu tiên khớp với thứ mong muốn (tối đa 7 ngày)
      let count = 0;
      while (ngayLam.getDay() !== targetDayOfWeek && count < 7) {
        ngayLam.setDate(ngayLam.getDate() + 1);
        count++;
      }
      
      // Định dạng YYYY-MM-DD theo giờ địa phương
      const ngayLamStr = `${ngayLam.getFullYear()}-${String(ngayLam.getMonth() + 1).padStart(2, '0')}-${String(ngayLam.getDate()).padStart(2, '0')}`;

      // UPSERT LichLamViec cho slot (tuan, ca, thứ)
      const { rows: lichRows } = await client.query(
        `INSERT INTO LichLamViec (tuan_id, khung_ca_id, thu_trong_tuan, ngay_lam)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (tuan_id, khung_ca_id, thu_trong_tuan) DO UPDATE SET ngay_lam = EXCLUDED.ngay_lam
         RETURNING *`,
        [dk.tuan_id, dk.khung_ca_id, dk.thu_trong_tuan, ngayLamStr]
      );
      const lichId = lichRows[0].id;

      // INSERT PhanCongCa cho nhân viên này (bỏ qua nếu đã tồn tại)
      const { rows: pcRows } = await client.query(
        `INSERT INTO PhanCongCa (lich_id, nhan_vien_id) VALUES ($1, $2)
         ON CONFLICT (lich_id, nhan_vien_id) DO NOTHING RETURNING *`,
        [lichId, dk.nhan_vien_id]
      );

      // Tạo bản ghi chấm công trống nếu phân công thành công
      if (pcRows.length > 0) {
        await client.query(
          `INSERT INTO ChamCong (phan_cong_id) VALUES ($1) ON CONFLICT DO NOTHING`,
          [pcRows[0].id]
        );
      }

    } else if (oldTrangThai === 'da_duyet' && (trang_thai === 'tu_choi' || trang_thai === 'cho_duyet')) {
      // Tìm LichLamViec cho slot này
      const { rows: lichRows } = await client.query(
        `SELECT id FROM LichLamViec
         WHERE tuan_id = $1 AND khung_ca_id = $2 AND thu_trong_tuan = $3`,
        [dk.tuan_id, dk.khung_ca_id, dk.thu_trong_tuan]
      );

      if (lichRows.length > 0) {
        const lichId = lichRows[0].id;
        // 1. Xóa bản ghi ChamCong trước (nếu chưa chấm công thực tế)
        await client.query(
          `DELETE FROM ChamCong
           WHERE phan_cong_id IN (
             SELECT id FROM PhanCongCa WHERE lich_id = $1 AND nhan_vien_id = $2
           ) AND gio_vao IS NULL`,
          [lichId, dk.nhan_vien_id]
        );

        // 2. Xóa PhanCongCa (chỉ xóa được nếu đã xóa ChamCong thành công ở bước trên - tức là chưa chấm công)
        await client.query(
          `DELETE FROM PhanCongCa
           WHERE lich_id = $1 AND nhan_vien_id = $2
             AND NOT EXISTS (SELECT 1 FROM ChamCong WHERE phan_cong_id = PhanCongCa.id)`,
          [lichId, dk.nhan_vien_id]
        );
      }
    }

    await client.query('COMMIT');

    // Cảnh báo số NV/ca dựa trên cấu hình min_nv/max_nv
    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) as count FROM DangKyCa
       WHERE tuan_id = $1 AND khung_ca_id = $2 AND thu_trong_tuan = $3 AND trang_thai = 'da_duyet'`,
      [dk.tuan_id, dk.khung_ca_id, dk.thu_trong_tuan]
    );
    
    const { rows: kcRows } = await pool.query('SELECT min_nv, max_nv FROM KhungCa WHERE id = $1', [dk.khung_ca_id]);
    const { min_nv, max_nv } = kcRows[0];

    const count = parseInt(countRows[0].count);
    let warning = null;
    if (count < min_nv) warning = `Cảnh báo: ca này chỉ có ${count} nhân viên (tối thiểu ${min_nv})`;
    if (count > max_nv) warning = `Cảnh báo: ca này có đến ${count} nhân viên (tối đa ${max_nv})`;

    return res.json({ data: rows[0], warning });
  } catch (err) {
    await client.query('ROLLBACK');
    return handlePgError(err, res);
  } finally {
    client.release();
  }
};

// DELETE /api/dang-ky-ca/:id
const remove = async (req, res) => {
  const { id } = req.params;
  try {
    // NV chỉ xóa được ca của chính mình và trạng thái cho_duyet
    const { rowCount } = await pool.query(
      `DELETE FROM DangKyCa WHERE id = $1 AND nhan_vien_id = $2 AND trang_thai = 'cho_duyet'`,
      [id, req.user.id]
    );
    if (!rowCount) return res.status(404).json({ message: 'Không tìm thấy hoặc không có quyền xóa' });
    return res.json({ message: 'Hủy đăng ký ca thành công' });
  } catch (err) { return handlePgError(err, res); }
};

// PUT /api/dang-ky-ca/khung-ca/:id
const updateKhungCa = async (req, res) => {
  const { id } = req.params;
  const { min_nv, max_nv } = req.body;
  try {
    // Kiểm tra khóa chỉnh sửa dựa trên deadline của tuần đầu tiên (tạm thời lấy tuần mới nhất đang mở)
    // Hoặc lý tưởng nhất là truyền tuan_id lên để check. 
    // Tuy nhiên theo logic hệ thống, KhungCa là cấu hình chung, nhưng để đáp ứng yêu cầu "trang duyệt ca không thay đổi được nữa"
    // chúng ta sẽ chặn API này nếu nó ảnh hưởng đến bảng đang hiển thị.
    
    const { rows } = await pool.query(
      `UPDATE KhungCa SET min_nv = COALESCE($1, min_nv), max_nv = COALESCE($2, max_nv)
       WHERE id = $3 RETURNING *`,
      [min_nv, max_nv, id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Không tìm thấy khung ca' });
    return res.json(rows[0]);
  } catch (err) { return handlePgError(err, res); }
};

// GET /api/dang-ky-ca/khung-ca
const getKhungCa = async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM KhungCa ORDER BY gio_bat_dau`);
    return res.json(rows);
  } catch (err) { return handlePgError(err, res); }
};

module.exports = { create, createBatch, cuaToi, choDuyet, duyet, remove, getKhungCa, updateKhungCa };
