# Phân Quyền & Chức Năng (Features List)

Hệ thống MiniMart HR ứng dụng mô hình Phân quyền dựa trên vai trò (Role-Based Access Control - RBAC). Tùy thuộc vào tài khoản đăng nhập, người dùng sẽ có giao diện và quyền thao tác khác nhau.

---

## 1. Vai trò CST — Chủ Siêu Thị (Admin)
*Đây là vai trò cao nhất, quản lý toàn bộ hệ thống từ nhân sự đến dòng tiền.*

**Tính năng cốt lõi:**
- **Dashboard Tổng quan**: Theo dõi chi phí lương thời gian thực, tổng số nhân sự, và biểu đồ hoạt động.
- **Quản lý Nhân sự (CRUD)**: Có quyền Tạo mới, Chỉnh sửa, Khóa/Mở khóa hoặc Xóa tài khoản nhân viên. Reset mật khẩu nhân viên về mặc định.
- **Kiểm soát Lịch làm việc**: Mặc dù thường giao cho QLC, nhưng CST vẫn có quyền cao nhất để Duyệt / Huỷ lịch làm việc.
- **Tài chính & Tiền lương**: 
  - Khởi tạo kỳ tính lương tự động.
  - Phê duyệt Bảng lương.
  - Quản lý danh mục Thưởng / Phạt.
- **Thông báo Nội bộ (Bảng tin)**: Đăng tải các chỉ thị, sự kiện. Được quyền thiết lập mức độ Khẩn Cấp (Màu Đỏ) và ghim (Pin) thông báo lên đầu trang.

---

## 2. Vai trò QLC — Quản Lý Ca (Manager)
*Là người chịu trách nhiệm vận hành chi nhánh/cửa hàng hàng ngày, điều phối lịch làm việc.*

**Tính năng cốt lõi:**
- **Vận hành Lịch làm việc (Schedule Grid)**: Xem dạng Lịch tuần (Weekly Schedule), đánh giá và ra quyết định phê duyệt các ca làm việc do nhân viên đăng ký.
- **Chấm công**: Cập nhật trạng thái đi làm thực tế, check-in / check-out. Điền lý do vắng mặt.
- **Xem thông tin nhân viên**: Có quyền xem danh sách nhân viên để liên hệ công việc (nhưng không có quyền Xóa hay Đổi mật khẩu của họ).
- **Phụ trợ thông báo**: Tương tự CST, QLC có quyền đăng tin tức nội bộ nhắc nhở ca làm việc hoặc các công việc dọn dẹp hàng ngày.

---

## 3. Vai trò NV — Nhân Viên (Employee)
*Đối tượng sử dụng số lượng lớn, cần giao diện tối giản, tập trung vào bản thân (Self-Service).*

**Tính năng cốt lõi:**
- **Dashboard Cá nhân**: Màn hình thiết kế gọn nhẹ, lập tức cho biết "Ca làm tiếp theo là khi nào?" và "Thu nhập ước tính tháng này là bao nhiêu?".
- **Đăng ký ca làm**: Chủ động truy cập màn hình Đăng ký để chọn khung giờ làm việc phù hợp với lịch cá nhân tuần tới.
- **Theo dõi chấm công**: Kiểm tra lịch sử đi làm xem quản lý có chấm sót công hay không.
- **Xem phiếu lương (Payslip)**: Xem chi tiết Bảng lương mỗi tháng được trình bày dưới dạng Phiếu Lương chuyên nghiệp.
- **Profile Self-Service**:
  - Tự cập nhật tài khoản ngân hàng, thông tin liên lạc. (Các mã số được bảo mật dạng `***`).
  - Chủ động đổi mật khẩu định kỳ.
- **Bảng tin (Read-only)**: Xem các thông báo từ Ban Giám đốc, cập nhật tình hình siêu thị mà không thể thay đổi nội dung bảng tin.
