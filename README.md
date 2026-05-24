# MiniMart HR — Hệ thống quản lý nhân sự siêu thị mini

Hệ thống hỗ trợ quản lý nhân viên, đăng ký ca, duyệt ca, chấm công, tính lương, thưởng phạt, thông báo nội bộ và hồ sơ cá nhân. Dự án cung cấp công cụ tự động hóa công tác nhân sự, cải thiện hiệu suất vận hành của các cửa hàng/siêu thị quy mô nhỏ và vừa.

---

## 🚀 Công nghệ sử dụng (Tech Stack)

- **Frontend**: React, Vite, Tailwind CSS, Heroicons
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Xác thực (Auth)**: JSON Web Token (JWT)

---

## 👥 Vai trò người dùng

Hệ thống cung cấp 3 vai trò (Role) cốt lõi với quyền hạn được phân chia rõ ràng:

1. **CST (Chủ siêu thị)**: Toàn quyền truy cập. Quản trị hệ thống, cấp phát tài khoản nhân sự, tính toán quỹ lương và thưởng phạt.
2. **QLC (Quản lý ca)**: Theo dõi tiến độ công việc, duyệt đăng ký ca, cập nhật trạng thái lịch làm việc.
3. **NV (Nhân viên)**: Đăng ký ca làm, theo dõi chấm công, xem phiếu lương cá nhân (Payslip), và chỉnh sửa thông tin hồ sơ (Employee Self-Service).

---

## 🎯 Chức năng chính

- **Đăng nhập / phân quyền**: Hệ thống xác thực bằng phân quyền Role-based mạnh mẽ.
- **Quản lý nhân viên**: Khởi tạo, cập nhật hồ sơ, khóa tài khoản.
- **Đăng ký & Duyệt ca**: Quản lý lịch làm việc linh hoạt, hiển thị qua giao diện Weekly Schedule hiện đại.
- **Chấm công**: Ghi nhận thời gian ra vào ca thực tế.
- **Tính lương & Thưởng phạt**: Tự động tính công, xuất Phiếu Lương (Payslip UI).
- **Hồ sơ cá nhân (Self-Service)**: Nhân viên tự do kiểm tra thông tin thu nhập, đổi mật khẩu.
- **Bảng tin nội bộ (Bulletin Board)**: CST và QLC có thể gắn thẻ (Pin) thông báo, phân cấp độ Khẩn cấp/Thông tin.
- **Dashboard**: Thống kê động, tuỳ chỉnh nội dung hiển thị riêng cho CST, QLC hoặc NV.
- **CRUD Operations**: Danh sách hỗ trợ Client-side Search, Filter tiện dụng.

---

## ⚙️ Hướng dẫn cài đặt và chạy ứng dụng

### 1. Database (PostgreSQL)
Đảm bảo bạn đã có PostgreSQL. Bạn có thể sử dụng Docker để khởi chạy nhanh cơ sở dữ liệu:
```bash
docker run --name minimart-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=sieu_thi_db -p 5433:5432 -d postgres
```
Sau đó, hãy load schema và file seed (`database/schema.sql`, `database/seed.sql`) để khởi tạo dữ liệu mẫu.

### 2. Backend (Node.js)
Tạo file `.env` mẫu dựa trên `backend/.env.example`. Chú ý: **Tuyệt đối không commit file `.env` lên repository công khai**.

```bash
cd backend
npm install
npm run dev
```

File `.env` mẫu cho backend:
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
DB_HOST=localhost
DB_PORT=5433
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=sieu_thi_db
ENCRYPT_KEY=sieu_thi_secret_2026
JWT_ACCESS_SECRET=your_jwt_access_secret_key_here
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here
JWT_REFRESH_EXPIRES=7d
```

### 3. Frontend (React)
Tạo file `.env` trong thư mục `frontend` nếu cần cấu hình API Endpoint.

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

File `.env` mẫu cho frontend:
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🔑 Tài khoản Demo (Seed Data)

Sử dụng các tài khoản có sẵn trong cơ sở dữ liệu để trải nghiệm nhanh:

- **Chủ siêu thị (CST)**
  - Username: `admin`
  - Password: `Password123!`
- **Quản lý ca (QLC)**
  - Username: `quanly`
  - Password: `Password123!`
- **Nhân viên (NV)**
  - Username: `nv1`
  - Password: `Password123!`

---

## 📁 Cấu trúc thư mục (Folder Structure)

```text
├── backend
│   ├── src/controllers    # Điều hướng logic và trả về HTTP Responses
│   ├── src/routes         # Định nghĩa các endpoint API
│   └── src/middleware     # Xử lý bảo mật, Phân quyền (RBAC), Validation, Error Handling
├── frontend
│   ├── src/pages          # Các trang giao diện chính (Dashboard, DuyetDangKy, BangLuong, v.v.)
│   └── src/components     # Các React Component dùng chung (StatCard, SkeletonTable, NotificationCard)
└── database               # Chứa script khởi tạo bảng (schema) và dữ liệu mẫu (seed)
```

---

## 🛡️ Ghi chú Bảo mật & Độ ổn định (Hardening)

- **JWT Auth & Cookies**: Xác thực bảo mật hai lớp Token.
- **Role-based Access Control (RBAC)**: Chỉ người dùng có vai trò hợp lệ mới được tiếp cận tài nguyên (vd: NV không được xoá nhân sự).
- **Backend Validation**: Dữ liệu vào (Input) đều bị kiểm soát nghiêm ngặt bằng Middleware nhằm tránh tấn công rác và chống Crash.
- **Global Error Handling**: Middleware bắt lỗi tập trung (Catch-all Error Handler), tự động chặn Stack Trace khi chạy ở môi trường Production.
- **Masking Audit Logs**: Các thông tin vô cùng nhạy cảm (`mat_khau`, `refreshToken`) bị mã hóa thành `***` trước khi được lưu vết hệ thống.
- **Environment Variables**: An toàn cấu hình thông qua biến môi trường.
