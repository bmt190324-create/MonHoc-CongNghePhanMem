/**
 * setup.js — Tạo database + apply schema + seed data
 * Chạy: node database/setup.js
 */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const SALT_ROUNDS = 12;

async function setup() {
  // 1. Kết nối postgres để tạo database
  const adminClient = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'postgres',
  });

  await adminClient.connect();
  console.log('✅ Kết nối PostgreSQL thành công');

  const dbName = process.env.DB_NAME || 'sieu_thi_db';
  const exists = await adminClient.query(
    `SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]
  );

  if (exists.rowCount === 0) {
    await adminClient.query(`CREATE DATABASE "${dbName}"`);
    console.log(`✅ Tạo database "${dbName}" thành công`);
  } else {
    console.log(`ℹ️  Database "${dbName}" đã tồn tại`);
  }
  await adminClient.end();

  // 2. Kết nối vào database vừa tạo
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: dbName,
  });
  await client.connect();

  // 3. Apply schema
  const schema = fs.readFileSync(path.join(__dirname, '../../database/schema.sql'), 'utf8');
  await client.query(schema);
  console.log('✅ Schema đã được áp dụng');

  // 4. Apply seed (cần SECRET_KEY_SEED match với .env)
  const seedKey = process.env.ENCRYPT_KEY || 'sieu_thi_secret_2026';
  const seed = fs.readFileSync(path.join(__dirname, '../../database/seed.sql'), 'utf8')
    .replace(/SECRET_KEY_SEED/g, seedKey);
  await client.query(seed);
  console.log('✅ Dữ liệu mẫu đã được import');

  // 5. Tạo tài khoản với bcrypt hash thực
  const defaultPassword = 'Password123!';
  const hash = await bcrypt.hash(defaultPassword, SALT_ROUNDS);
  console.log('🔐 Đang hash mật khẩu mặc định...');

  const accounts = [
    { nhan_vien_id: 1, ten_dang_nhap: 'admin' },
    { nhan_vien_id: 2, ten_dang_nhap: 'quanly' },
    { nhan_vien_id: 3, ten_dang_nhap: 'nv1' },
    { nhan_vien_id: 4, ten_dang_nhap: 'nv2' },
    { nhan_vien_id: 5, ten_dang_nhap: 'nv3' },
  ];

  for (const acc of accounts) {
    await client.query(
      `INSERT INTO TaiKhoan (nhan_vien_id, ten_dang_nhap, mat_khau_hash)
       VALUES ($1, $2, $3)
       ON CONFLICT (ten_dang_nhap) DO NOTHING`,
      [acc.nhan_vien_id, acc.ten_dang_nhap, hash]
    );
  }
  console.log('✅ Tài khoản mẫu đã được tạo');

  await client.end();

  console.log('\n🎉 Setup hoàn tất!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Tài khoản mặc định (mật khẩu: Password123!):');
  console.log('  CST: admin');
  console.log('  QLC: quanly');
  console.log('  NV:  nv1, nv2, nv3');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

setup().catch(err => {
  console.error('❌ Lỗi setup:', err.message);
  process.exit(1);
});
