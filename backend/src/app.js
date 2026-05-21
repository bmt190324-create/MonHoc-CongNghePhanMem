require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// ── Security ──────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// ── Rate Limiting ─────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  max: 10,
  message: { message: 'Quá nhiều yêu cầu đăng nhập. Vui lòng thử lại sau 1 phút.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
});

// ── Middleware ─────────────────────────────────────
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/api', apiLimiter);

// ── Routes ─────────────────────────────────────────
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/nhan-vien', require('./routes/nhanVien.routes'));
app.use('/api/tuan-lam-viec', require('./routes/tuanLamViec.routes'));
app.use('/api/dang-ky-ca', require('./routes/dangKyCa.routes'));
app.use('/api/lich-lam-viec', require('./routes/lichLamViec.routes'));
app.use('/api/phan-cong-ca', require('./routes/phanCongCa.routes'));
app.use('/api/cham-cong', require('./routes/chamCong.routes'));
app.use('/api/thuong-phat', require('./routes/thuongPhat.routes'));
app.use('/api/bang-luong', require('./routes/bangLuong.routes'));
app.use('/api/cau-hinh-luong', require('./routes/cauHinhLuong.routes'));
app.use('/api/thong-ke', require('./routes/thongKe.routes'));
app.use('/api/thong-bao', require('./routes/thongBao.routes'));

// ── Health Check ───────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// ── 404 ────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ message: 'API không tồn tại' }));

// ── Error Handler ──────────────────────────────────
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const { ensureWeeks } = require('./utils/autoWeeks');

app.listen(PORT, async () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
  console.log(`📎 Môi trường: ${process.env.NODE_ENV || 'development'}`);
  
  // Tự động tạo tuần hiện tại và tuần sau khi khởi động
  await ensureWeeks();
  
  // Kiểm tra và tạo lại mỗi 24 giờ để luôn có tuần mới
  setInterval(ensureWeeks, 24 * 60 * 60 * 1000);

  // Khởi động cron job dọn dẹp tài khoản
  const { cleanupDisabledAccounts } = require('./jobs/cleanup');
  await cleanupDisabledAccounts();
});

module.exports = app;
