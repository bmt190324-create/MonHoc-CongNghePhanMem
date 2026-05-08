-- ============================================================
-- SEED DATA — Dữ liệu mẫu hệ thống
-- ============================================================

-- 1. Vai trò
INSERT INTO VaiTro (ten_vai_tro, mo_ta) VALUES
  ('CST', 'Chủ siêu thị — toàn quyền quản lý'),
  ('QLC', 'Quản lý ca — duyệt ca, chấm công'),
  ('NV',  'Nhân viên — đăng ký ca, xem lịch')
ON CONFLICT DO NOTHING;

-- 2. Khung ca (Seed cố định)
INSERT INTO KhungCa (ten_ca, gio_bat_dau, gio_ket_thuc) VALUES
  ('Sáng', '08:00', '12:00'),
  ('Chiều', '13:00', '17:00'),
  ('Tối', '17:00', '21:00')
ON CONFLICT DO NOTHING;

-- 3. Nhân viên mẫu
-- Mật khẩu mặc định: "Password123!" (bcrypt sẽ hash ở app layer)
-- Ở đây ta dùng hash sẵn bằng bcrypt cost 12 của "Password123!"
-- Hash: $2b$12$LQv3c1yqBWVHxkd0LXo7DejM0c7tqfqCCJmKIBqLSBJxJwJkAyJEi
-- (Sẽ được tạo bởi seed script Node.js trong setup.js)

INSERT INTO NhanVien (ho_ten, cccd, the_sinh_vien, so_tai_khoan, vai_tro_id, trang_thai) VALUES
  ('Nguyễn Minh Chủ',   pgp_sym_encrypt('012345678901', 'SECRET_KEY_SEED'), NULL, pgp_sym_encrypt('1234567890', 'SECRET_KEY_SEED'), 1, TRUE),
  ('Trần Thị Quản',     pgp_sym_encrypt('012345678902', 'SECRET_KEY_SEED'), NULL, pgp_sym_encrypt('2345678901', 'SECRET_KEY_SEED'), 2, TRUE),
  ('Lê Văn Nhân 1',     pgp_sym_encrypt('012345678903', 'SECRET_KEY_SEED'), 'SV001', pgp_sym_encrypt('3456789012', 'SECRET_KEY_SEED'), 3, TRUE),
  ('Phạm Thị Nhân 2',   pgp_sym_encrypt('012345678904', 'SECRET_KEY_SEED'), 'SV002', pgp_sym_encrypt('4567890123', 'SECRET_KEY_SEED'), 3, TRUE),
  ('Hoàng Văn Nhân 3',  pgp_sym_encrypt('012345678905', 'SECRET_KEY_SEED'), 'SV003', pgp_sym_encrypt('5678901234', 'SECRET_KEY_SEED'), 3, TRUE),
  ('Ngô Thị Nhân 4',    pgp_sym_encrypt('012345678906', 'SECRET_KEY_SEED'), 'SV004', pgp_sym_encrypt('6789012345', 'SECRET_KEY_SEED'), 3, TRUE),
  ('Đỗ Văn Nhân 5',     pgp_sym_encrypt('012345678907', 'SECRET_KEY_SEED'), 'SV005', pgp_sym_encrypt('7890123456', 'SECRET_KEY_SEED'), 3, TRUE)
ON CONFLICT DO NOTHING;

-- 4. Cấu hình lương (đơn giá mẫu, INSERT-only)
INSERT INTO CauHinhLuong (don_gia_gio, ngay_ap_dung, ghi_chu, nguoi_tao) VALUES
  (25000, '2025-01-01', 'Mức lương áp dụng từ 01/2025', 1),
  (27000, '2025-07-01', 'Tăng lương theo lạm phát H2/2025', 1),
  (30000, '2026-01-01', 'Mức lương áp dụng từ 01/2026', 1)
ON CONFLICT DO NOTHING;

-- 5. Tuần làm việc mẫu (tuần hiện tại)
INSERT INTO TuanLamViec (ngay_bat_dau, ngay_ket_thuc, deadline_dk, trang_thai) VALUES
  ('2026-03-30', '2026-04-05', '2026-03-29 12:00:00+07', 'hoan_thanh'),
  ('2026-04-06', '2026-04-12', '2026-04-05 12:00:00+07', 'hoan_thanh'),
  ('2026-04-13', '2026-04-19', '2026-04-12 12:00:00+07', 'khoa'),
  ('2026-04-20', '2026-04-26', '2026-04-19 12:00:00+07', 'mo'),
  ('2026-04-27', '2026-05-03', '2026-04-26 12:00:00+07', 'mo')
ON CONFLICT DO NOTHING;

-- 6. Tài khoản (hash được tạo bởi setup.js)
-- Tài khoản mẫu: 
--   admin / Password123! (CST - id=1)
--   quanly / Password123! (QLC - id=2)  
--   nv1 / Password123! (NV - id=3)
-- NOTE: Hash thực sẽ được insert bởi script setup.js
