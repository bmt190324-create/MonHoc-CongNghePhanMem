/**
 * Middleware để kiểm tra các trường dữ liệu bắt buộc (required fields).
 * Chặn lỗi ở tầng route thay vì để controller bị crash.
 *
 * @param {string[]} requiredFields - Danh sách tên các trường bắt buộc trong req.body
 */
const validateRequired = (requiredFields) => {
  return (req, res, next) => {
    const missingFields = [];

    for (const field of requiredFields) {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Thiếu dữ liệu bắt buộc: ${missingFields.join(', ')}`
      });
    }

    next();
  };
};

module.exports = { validateRequired };
