-- ============================================================
-- HỆ THỐNG QUẢN LÝ NHÂN SỰ SIÊU THỊ MINI
-- Schema PostgreSQL - Chuẩn 3NF
-- ============================================================

-- Enable pgcrypto for at-rest encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. VaiTro
-- ============================================================
CREATE TABLE IF NOT EXISTS VaiTro (
  id SERIAL PRIMARY KEY,
  ten_vai_tro VARCHAR(10) NOT NULL CHECK (ten_vai_tro IN ('CST', 'QLC', 'NV')),
  mo_ta TEXT
);

-- ============================================================
-- 2. NhanVien
-- ============================================================
CREATE TABLE IF NOT EXISTS NhanVien (
  id SERIAL PRIMARY KEY,
  ho_ten VARCHAR(100) NOT NULL,
  cccd TEXT,                          -- mã hóa at-rest bằng pgcrypto
  the_sinh_vien VARCHAR(20),
  so_tai_khoan TEXT,                  -- mã hóa at-rest bằng pgcrypto
  vai_tro_id INT REFERENCES VaiTro(id),
  trang_thai BOOLEAN DEFAULT TRUE,    -- soft delete
  ngay_vo_hieu_hoa TIMESTAMPTZ,       -- track when account was disabled
  ngay_tao TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. TaiKhoan (tách riêng khỏi NhanVien)
-- ============================================================
CREATE TABLE IF NOT EXISTS TaiKhoan (
  id SERIAL PRIMARY KEY,
  nhan_vien_id INT UNIQUE REFERENCES NhanVien(id),
  ten_dang_nhap VARCHAR(50) UNIQUE NOT NULL,
  mat_khau_hash VARCHAR(255) NOT NULL,  -- bcrypt cost>=12
  so_lan_sai INT DEFAULT 0,
  bi_khoa BOOLEAN DEFAULT FALSE,
  lan_dang_nhap_cuoi TIMESTAMPTZ
);

-- ============================================================
-- 4. CauHinhLuong (INSERT-only, không UPDATE)
-- ============================================================
CREATE TABLE IF NOT EXISTS CauHinhLuong (
  id SERIAL PRIMARY KEY,
  don_gia_gio NUMERIC(12,2) NOT NULL,
  ngay_ap_dung DATE NOT NULL,
  ghi_chu TEXT,
  nguoi_tao INT REFERENCES NhanVien(id)
);

-- Prevent UPDATE on CauHinhLuong
CREATE OR REPLACE FUNCTION fn_prevent_chl_update()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'CauHinhLuong là bất biến — không được cập nhật, chỉ thêm mới.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_chl_update
BEFORE UPDATE ON CauHinhLuong
FOR EACH ROW EXECUTE FUNCTION fn_prevent_chl_update();

-- ============================================================
-- 5. TuanLamViec
-- ============================================================
CREATE TABLE IF NOT EXISTS TuanLamViec (
  id SERIAL PRIMARY KEY,
  ngay_bat_dau DATE UNIQUE NOT NULL,
  ngay_ket_thuc DATE NOT NULL,
  deadline_dk TIMESTAMPTZ NOT NULL,
  trang_thai VARCHAR(20) DEFAULT 'mo' CHECK (trang_thai IN ('mo','khoa','hoan_thanh'))
);

-- ============================================================
-- 6. KhungCa
-- ============================================================
CREATE TABLE IF NOT EXISTS KhungCa (
  id SERIAL PRIMARY KEY,
  ten_ca VARCHAR(20) NOT NULL,
  gio_bat_dau TIME NOT NULL,
  gio_ket_thuc TIME NOT NULL,
  min_nv INT DEFAULT 2,
  max_nv INT DEFAULT 4
);

-- ============================================================
-- 7. DangKyCa
-- ============================================================
CREATE TABLE IF NOT EXISTS DangKyCa (
  id SERIAL PRIMARY KEY,
  nhan_vien_id INT REFERENCES NhanVien(id),
  tuan_id INT REFERENCES TuanLamViec(id),
  khung_ca_id INT REFERENCES KhungCa(id),
  thu_trong_tuan INT CHECK (thu_trong_tuan BETWEEN 2 AND 8),
  trang_thai VARCHAR(20) DEFAULT 'cho_duyet' CHECK (trang_thai IN ('cho_duyet','da_duyet','tu_choi')),
  thoi_gian_dk TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(nhan_vien_id, tuan_id, khung_ca_id, thu_trong_tuan)
);

-- ============================================================
-- 8. LichLamViec
-- ============================================================
CREATE TABLE IF NOT EXISTS LichLamViec (
  id SERIAL PRIMARY KEY,
  tuan_id INT REFERENCES TuanLamViec(id),
  khung_ca_id INT REFERENCES KhungCa(id),
  thu_trong_tuan INT NOT NULL,
  ngay_lam DATE NOT NULL,
  UNIQUE(tuan_id, khung_ca_id, thu_trong_tuan)
);

-- ============================================================
-- 9. PhanCongCa (N-N: NhanVien <-> LichLamViec)
-- ============================================================
CREATE TABLE IF NOT EXISTS PhanCongCa (
  id SERIAL PRIMARY KEY,
  lich_id INT REFERENCES LichLamViec(id),
  nhan_vien_id INT REFERENCES NhanVien(id),
  UNIQUE(lich_id, nhan_vien_id)
);

-- ============================================================
-- 10. ChamCong
-- ============================================================
CREATE TABLE IF NOT EXISTS ChamCong (
  id SERIAL PRIMARY KEY,
  phan_cong_id INT UNIQUE REFERENCES PhanCongCa(id),
  gio_vao TIMESTAMPTZ,
  gio_ra TIMESTAMPTZ,
  so_gio_thuc_te NUMERIC(4,2),
  trang_thai VARCHAR(20) DEFAULT 'chua_cham'
    CHECK (trang_thai IN ('hop_le','di_tre','vang_mat','chua_cham')),
  so_phut_tre INT DEFAULT 0,
  ghi_chu TEXT,
  nguoi_cham INT REFERENCES NhanVien(id),
  thoi_gian_cap_nhat TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 11. ThuongPhat
-- ============================================================
CREATE TABLE IF NOT EXISTS ThuongPhat (
  id SERIAL PRIMARY KEY,
  nhan_vien_id INT REFERENCES NhanVien(id),
  ngay DATE NOT NULL,
  loai VARCHAR(10) CHECK (loai IN ('thuong','phat')),
  so_tien NUMERIC(12,2) NOT NULL,
  ly_do TEXT,
  nguoi_tao INT REFERENCES NhanVien(id)
);

-- ============================================================
-- 12. BangLuong
-- ============================================================
CREATE TABLE IF NOT EXISTS BangLuong (
  id SERIAL PRIMARY KEY,
  nhan_vien_id INT REFERENCES NhanVien(id),
  thang INT NOT NULL,
  nam INT NOT NULL,
  tong_gio_lam NUMERIC(6,2),
  don_gia_ap_dung NUMERIC(12,2),
  luong_co_ban NUMERIC(12,2),
  tong_thuong_phat NUMERIC(12,2) DEFAULT 0,
  tong_luong NUMERIC(12,2),
  trang_thai VARCHAR(20) DEFAULT 'nhap' CHECK (trang_thai IN ('nhap','da_duyet','da_tra')),
  ngay_tao TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(nhan_vien_id, thang, nam)
);

-- ============================================================
-- Nhật ký hệ thống
-- ============================================================
CREATE TABLE IF NOT EXISTS NhatKyHeThong (
  id SERIAL PRIMARY KEY,
  nguoi_dung_id INT REFERENCES NhanVien(id),
  hanh_dong VARCHAR(50) NOT NULL,
  bang_lien_quan VARCHAR(50),
  du_lieu_cu JSONB,
  du_lieu_moi JSONB,
  thoi_gian TIMESTAMPTZ DEFAULT NOW(),
  dia_chi_ip VARCHAR(45)
);

-- ============================================================
-- TRIGGER 1: Kiểm tra deadline đăng ký ca
-- ============================================================
CREATE OR REPLACE FUNCTION fn_kiem_tra_deadline()
RETURNS TRIGGER AS $$
DECLARE v_deadline TIMESTAMPTZ;
  v_trang_thai VARCHAR(20);
BEGIN
  SELECT deadline_dk, trang_thai INTO v_deadline, v_trang_thai
  FROM TuanLamViec WHERE id = NEW.tuan_id;

  IF v_trang_thai != 'mo' THEN
    RAISE EXCEPTION 'Tuần làm việc này đã đóng đăng ký (trạng thái: %).', v_trang_thai;
  END IF;

  IF NOW() > v_deadline THEN
    RAISE EXCEPTION 'Đã quá hạn đăng ký ca (deadline: %)', v_deadline;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_kiem_tra_deadline_dk
BEFORE INSERT ON DangKyCa
FOR EACH ROW EXECUTE FUNCTION fn_kiem_tra_deadline();

-- ============================================================
-- TRIGGER 2: Kiểm tra số lượng NV/ca (max 4)
-- ============================================================
CREATE OR REPLACE FUNCTION fn_kiem_tra_so_luong_nv()
RETURNS TRIGGER AS $$
DECLARE v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count FROM PhanCongCa WHERE lich_id = NEW.lich_id;
  IF v_count >= 4 THEN
    RAISE EXCEPTION 'Ca này đã đủ 4 nhân viên, không thể thêm.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_kiem_tra_so_luong_nv
BEFORE INSERT ON PhanCongCa
FOR EACH ROW EXECUTE FUNCTION fn_kiem_tra_so_luong_nv();

-- ============================================================
-- TRIGGER 3: Tự động xác định trạng thái chấm công
-- ============================================================
CREATE OR REPLACE FUNCTION fn_trang_thai_cham_cong()
RETURNS TRIGGER AS $$
DECLARE
  v_gio_bd TIME;
  v_phut_tre INT;
BEGIN
  SELECT kc.gio_bat_dau INTO v_gio_bd
  FROM PhanCongCa pc
  JOIN LichLamViec l ON l.id = pc.lich_id
  JOIN KhungCa kc ON kc.id = l.khung_ca_id
  WHERE pc.id = NEW.phan_cong_id;

  IF NEW.gio_vao IS NULL THEN
    NEW.trang_thai := 'vang_mat';
    NEW.so_gio_thuc_te := 0;
  ELSE
    v_phut_tre := GREATEST(0, EXTRACT(EPOCH FROM (NEW.gio_vao::TIME - v_gio_bd)) / 60);
    IF v_phut_tre > 15 THEN
      NEW.trang_thai := 'di_tre';
      NEW.so_phut_tre := v_phut_tre;
    ELSE
      NEW.trang_thai := 'hop_le';
      NEW.so_phut_tre := 0;
    END IF;
    IF NEW.gio_ra IS NOT NULL THEN
      IF NEW.gio_ra < NEW.gio_vao THEN
        NEW.so_gio_thuc_te := ROUND(EXTRACT(EPOCH FROM (NEW.gio_ra - NEW.gio_vao + INTERVAL '1 day')) / 3600.0, 2);
      ELSE
        NEW.so_gio_thuc_te := ROUND(EXTRACT(EPOCH FROM (NEW.gio_ra - NEW.gio_vao)) / 3600.0, 2);
      END IF;
    END IF;
  END IF;
  NEW.thoi_gian_cap_nhat := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_trang_thai_cham_cong
BEFORE INSERT OR UPDATE ON ChamCong
FOR EACH ROW EXECUTE FUNCTION fn_trang_thai_cham_cong();

-- ============================================================
-- STORED PROCEDURE: Tính lương tháng
-- ============================================================
CREATE OR REPLACE PROCEDURE sp_tinh_luong(p_thang INT, p_nam INT)
LANGUAGE plpgsql AS $$
DECLARE
  v_nv RECORD;
  v_don_gia NUMERIC(12,2);
  v_tong_gio NUMERIC(6,2);
  v_tong_tp NUMERIC(12,2);
  v_ngay_cuoi DATE;
BEGIN
  v_ngay_cuoi := (DATE_TRUNC('month', MAKE_DATE(p_nam, p_thang, 1)) + INTERVAL '1 month - 1 day')::DATE;

  SELECT don_gia_gio INTO v_don_gia
  FROM CauHinhLuong
  WHERE ngay_ap_dung <= v_ngay_cuoi
  ORDER BY ngay_ap_dung DESC LIMIT 1;

  IF v_don_gia IS NULL THEN
    RAISE EXCEPTION 'Chưa có cấu hình đơn giá lương cho tháng %/%', p_thang, p_nam;
  END IF;

  FOR v_nv IN SELECT id FROM NhanVien WHERE trang_thai = TRUE LOOP
    SELECT COALESCE(SUM(cc.so_gio_thuc_te), 0) INTO v_tong_gio
    FROM ChamCong cc
    JOIN PhanCongCa pc ON pc.id = cc.phan_cong_id
    JOIN LichLamViec l ON l.id = pc.lich_id
    WHERE pc.nhan_vien_id = v_nv.id
      AND EXTRACT(MONTH FROM l.ngay_lam) = p_thang
      AND EXTRACT(YEAR FROM l.ngay_lam) = p_nam
      AND cc.trang_thai IN ('hop_le', 'di_tre');

    SELECT COALESCE(SUM(CASE WHEN loai='thuong' THEN so_tien ELSE -so_tien END), 0) INTO v_tong_tp
    FROM ThuongPhat
    WHERE nhan_vien_id = v_nv.id
      AND EXTRACT(MONTH FROM ngay) = p_thang
      AND EXTRACT(YEAR FROM ngay) = p_nam;

    INSERT INTO BangLuong (nhan_vien_id, thang, nam, tong_gio_lam, don_gia_ap_dung,
                           luong_co_ban, tong_thuong_phat, tong_luong)
    VALUES (v_nv.id, p_thang, p_nam, v_tong_gio, v_don_gia,
            v_tong_gio * v_don_gia, v_tong_tp, v_tong_gio * v_don_gia + v_tong_tp)
    ON CONFLICT (nhan_vien_id, thang, nam) DO UPDATE
      SET tong_gio_lam    = EXCLUDED.tong_gio_lam,
          don_gia_ap_dung = EXCLUDED.don_gia_ap_dung,
          luong_co_ban    = EXCLUDED.luong_co_ban,
          tong_thuong_phat= EXCLUDED.tong_thuong_phat,
          tong_luong      = EXCLUDED.tong_luong;
  END LOOP;
END;
$$;


-- ============================================================
-- 14. ThongBao
-- ============================================================
CREATE TABLE IF NOT EXISTS ThongBao (
  id SERIAL PRIMARY KEY,
  tieu_de VARCHAR(255) NOT NULL,
  noi_dung TEXT NOT NULL,
  muc_do VARCHAR(20) DEFAULT 'info',
  is_pinned BOOLEAN DEFAULT FALSE,
  nguoi_tao INT REFERENCES NhanVien(id),
  ngay_tao TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

