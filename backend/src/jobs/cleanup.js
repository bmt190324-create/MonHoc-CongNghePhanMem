const cron = require('node-cron');
const pool = require('../config/db');

const cleanupDisabledAccounts = async () => {
    console.log('[CRON] Bắt đầu dọn dẹp các tài khoản vô hiệu hóa quá 20 ngày...');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Tìm các nhân viên đã bị vô hiệu hóa quá 20 ngày
        const { rows } = await client.query(`
            SELECT id, ho_ten FROM NhanVien 
            WHERE trang_thai = FALSE 
              AND ngay_vo_hieu_hoa <= NOW() - INTERVAL '20 days'
        `);

        if (rows.length === 0) {
            console.log('[CRON] Không có tài khoản nào cần xóa.');
            await client.query('COMMIT');
            return;
        }

        console.log(`[CRON] Tìm thấy ${rows.length} tài khoản cần xóa.`);

        for (const nv of rows) {
            try {
                // Xóa TaiKhoan (Tài khoản đăng nhập)
                await client.query('DELETE FROM TaiKhoan WHERE nhan_vien_id = $1', [nv.id]);
                
                // Xóa các dữ liệu liên quan khác (Tùy chọn, để xóa NhanVien thành công)
                await client.query('DELETE FROM ThuongPhat WHERE nhan_vien_id = $1', [nv.id]);
                await client.query('DELETE FROM BangLuong WHERE nhan_vien_id = $1', [nv.id]);
                await client.query('DELETE FROM DangKyCa WHERE nhan_vien_id = $1', [nv.id]);
                
                // Xóa chấm công liên quan đến phân công của nhân viên
                await client.query(`
                    DELETE FROM ChamCong 
                    WHERE phan_cong_id IN (SELECT id FROM PhanCongCa WHERE nhan_vien_id = $1)
                `, [nv.id]);
                await client.query('DELETE FROM PhanCongCa WHERE nhan_vien_id = $1', [nv.id]);

                // Update CauHinhLuong nguoi_tao to NULL if they created any
                await client.query('UPDATE CauHinhLuong SET nguoi_tao = NULL WHERE nguoi_tao = $1', [nv.id]);

                // Update NhatKyHeThong to NULL (giữ lại log hệ thống)
                await client.query('UPDATE NhatKyHeThong SET nguoi_dung_id = NULL WHERE nguoi_dung_id = $1', [nv.id]);

                // Cuối cùng xóa NhanVien
                await client.query('DELETE FROM NhanVien WHERE id = $1', [nv.id]);
                console.log(`[CRON] Đã xóa hoàn toàn nhân viên: ${nv.ho_ten} (ID: ${nv.id})`);
            } catch (err) {
                console.error(`[CRON] Lỗi khi xóa nhân viên ${nv.id}:`, err.message);
                // Continue to the next one
            }
        }

        await client.query('COMMIT');
        console.log('[CRON] Hoàn tất dọn dẹp.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[CRON] Lỗi quá trình dọn dẹp:', err);
    } finally {
        client.release();
    }
};

// Chạy vào 00:00 mỗi ngày
cron.schedule('0 0 * * *', cleanupDisabledAccounts, {
    timezone: "Asia/Ho_Chi_Minh"
});

module.exports = { cleanupDisabledAccounts };
