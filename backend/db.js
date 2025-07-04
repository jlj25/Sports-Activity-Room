const mysql = require('mysql2/promise'); // 导入mysql2
require('dotenv').config(); // 加载.env文件的配置

// 创建数据库连接池（高效管理数据库连接）
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  connectionLimit: 10 // 最多同时建立10个连接
});

// 测试连接是否成功
async function testDbConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('数据库连接成功！');
    connection.release(); // 释放连接
  } catch (err) {
    console.error('数据库连接失败：', err);
  }
}

// 执行测试
testDbConnection();

// 导出连接池，供其他文件使用
module.exports = pool;