const pool = require('../config/db');

/**
 * Mask sensitive data in request bodies before logging
 */
const maskSensitiveData = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const sensitiveKeys = ['mat_khau', 'mat_khau_cu', 'mat_khau_moi', 'refreshToken', 'accessToken', 'token', 'authorization'];
  const maskedData = { ...data };
  
  for (const key of Object.keys(maskedData)) {
    if (sensitiveKeys.includes(key)) {
      maskedData[key] = '***';
    } else if (typeof maskedData[key] === 'object' && maskedData[key] !== null) {
      maskedData[key] = maskSensitiveData(maskedData[key]);
    }
  }
  
  return maskedData;
};

/**
 * Ghi nhật ký hệ thống vào NhatKyHeThong
 */
const auditLog = (hanhDong, bangLienQuan) => async (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = function (data) {
    // Chỉ log khi request thành công (2xx)
    if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
      const duLieuMoi = req.body ? maskSensitiveData(req.body) : null;
      pool.query(
        `INSERT INTO NhatKyHeThong (nguoi_dung_id, hanh_dong, bang_lien_quan, du_lieu_moi, dia_chi_ip)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          req.user.id,
          hanhDong,
          bangLienQuan,
          duLieuMoi ? JSON.stringify(duLieuMoi) : null,
          req.ip || req.connection?.remoteAddress,
        ]
      ).catch(err => console.error('Audit log error:', err.message));
    }
    return originalJson(data);
  };

  next();
};

module.exports = auditLog;
