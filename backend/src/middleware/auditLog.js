const pool = require('../config/db');

const auditLog = (hanhDong, bangLienQuan) => async (req, res, next) => {
  const start = Date.now();

  res.on('finish', async () => {
    if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
      try {
        await pool.query(
          `INSERT INTO NhatKyHeThong 
           (nguoi_dung_id, hanh_dong, bang_lien_quan, du_lieu_moi, dia_chi_ip)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            req.user.id,
            hanhDong,
            bangLienQuan,
            JSON.stringify({
              body: req.body,
              method: req.method,
              path: req.originalUrl,
              statusCode: res.statusCode,
              durationMs: Date.now() - start,
              userAgent: req.headers['user-agent'],
            }),
            req.ip || req.connection?.remoteAddress,
          ]
        );
      } catch (err) {
        console.error('Audit log error:', err.message);
      }
    }
  });

  next();
};

module.exports = auditLog;