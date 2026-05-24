/**
 * Xử lý lỗi PostgreSQL và trả về message thân thiện
 */
const handlePgError = (err, res) => {
  console.error('DB Error:', err.code, err.message);

  if (err.code === 'P0001') {
    // RAISE EXCEPTION từ trigger/function
    return res.status(422).json({ success: false, message: err.message });
  }
  if (err.code === '23505') {
    // Unique constraint violation
    return res.status(409).json({ success: false, message: 'Dữ liệu đã tồn tại trong hệ thống' });
  }
  if (err.code === '23503') {
    // Foreign key violation
    return res.status(400).json({ success: false, message: 'Dữ liệu tham chiếu không tồn tại' });
  }
  if (err.code === '23514') {
    // Check constraint violation
    return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ: ' + err.detail });
  }
  return res.status(500).json({ success: false, message: 'Lỗi server nội bộ' });
};

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('Unhandled error:', err.message);

  if (err.code) {
    return handlePgError(err, res);
  }

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Lỗi server',
    error: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
};

module.exports = { errorHandler, handlePgError };
