// Quick MySQL connection test - run on server: node backend/test-db.js
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mysql = require('mysql2/promise');

async function test() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'si_kaskul',
  };
  console.log('Testing connection with:', JSON.stringify({ ...config, password: '***' }));
  try {
    const conn = await mysql.createConnection(config);
    const [rows] = await conn.query('SELECT COUNT(*) AS count FROM penduduk');
    console.log('✅ Connected! Penduduk count:', rows[0].count);
    await conn.end();
  } catch (e) {
    console.error('❌ Failed:', e.code, '-', e.message);
  }
}
test();
