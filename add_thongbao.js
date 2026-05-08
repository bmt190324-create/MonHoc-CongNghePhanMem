const pool = require('./backend/src/config/db');

async function createTable() {
    try {
        await pool.query(`CREATE TABLE IF NOT EXISTS ThongBao (
            id SERIAL PRIMARY KEY,
            tieu_de VARCHAR(255) NOT NULL,
            noi_dung TEXT NOT NULL,
            muc_do VARCHAR(20) DEFAULT 'info',
            nguoi_tao INT REFERENCES NhanVien(id),
            ngay_tao TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )`);
        console.log('ThongBao table created successfully');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

createTable();
