# MiniMart HR — Hệ thống Quản lý Nhân sự Siêu thị Mini

Hệ thống quản lý nhân sự chuyên biệt cho mô hình siêu thị mini, hỗ trợ quản lý ca làm việc, chấm công, tính lương và thông báo nội bộ.

## 🚀 Tính năng chính
- **Quản lý ca làm việc**: Đăng ký ca linh hoạt, phê duyệt ca dựa trên định mức nhân sự (Min/Max).
- **Tự động hóa lịch trình**: Tự động sinh tuần làm việc hiện tại và tiếp theo theo thời gian thực.
- **Chấm công thông minh**: Ghi nhận giờ vào/ra, tự động xác định đi trễ/vắng mặt.
- **Quản lý lương**: Tính lương tự động dựa trên giờ làm thực tế, đơn giá giờ (hỗ trợ lịch sử biến động lương) và thưởng/phạt.
- **Bảo mật dữ liệu**: Mã hóa thông tin nhạy cảm (CCCD, Số tài khoản) trong database.
- **Thông báo nội bộ**: Bảng tin chung có tính năng ghim thông báo quan trọng.

## 🛠 Tech Stack
- **Frontend**: React.js (Vite), Tailwind CSS (hoặc Vanilla CSS).
- **Backend**: Node.js, Express.js.
- **Database**: PostgreSQL (Chuẩn 3NF).

## 📦 Cài đặt

### 1. Database
- Đảm bảo đã cài đặt PostgreSQL.
- Tạo database mới hoặc sử dụng database mặc định.
- Cấu hình thông tin kết nối trong file `backend/.env`.

### 2. Backend
```bash
cd backend
npm install
# Khởi tạo database (Tạo bảng + Seed dữ liệu mẫu)
node scripts/setup.js
# Chạy server
npm run dev
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🔐 Tài khoản mặc định
Tất cả tài khoản đều có mật khẩu mặc định là: `Password123!`

- **Chủ siêu thị (CST)**: `admin`
- **Quản lý ca (QLC)**: `quanly`
- **Nhân viên (NV)**: `nv1`, `nv2`, `nv3`

## 📂 Cấu trúc thư mục
- `/backend`: API server và logic nghiệp vụ.
- `/frontend`: Giao diện người dùng.
- `/database`: Các file SQL (Schema, Seed).
- `add_weeks.js`: Script hỗ trợ quản lý tuần (hệ thống đã tích hợp tự động vào backend).

---
*Dự án được phát triển nhằm tối ưu hóa quy trình vận hành cho các chuỗi siêu thị vừa và nhỏ.*
