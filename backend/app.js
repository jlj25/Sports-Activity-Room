const express = require('express');
const cors = require('cors');
const pool = require('./db'); // 导入数据库连接池
require('dotenv').config();

// 创建express实例
const app = express();
const port = process.env.PORT || 3000;

// 中间件：解决跨域和解析JSON
app.use(cors()); // 允许跨域请求（小程序端才能调用）
app.use(express.json()); // 解析前端发送的JSON数据

// -------------- 以下是核心API接口 --------------

// 1. 测试接口（确认服务器是否正常运行）
app.get('/api/test', (req, res) => {
  res.send('后端服务器运行正常！');
});

// 2. 获取所有场馆列表（小程序首页展示用）
app.get('/api/venues', async (req, res) => {
  try {
    // 从数据库查询所有场馆
    const [venues] = await pool.query('SELECT * FROM venues');
    res.json(venues); // 返回场馆列表给前端
  } catch (err) {
    console.error('查询场馆失败：', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 3. 用户登录（通过微信openid获取或创建用户）
app.post('/api/login', async (req, res) => {
  try {
    const { openid, nickname, avatarUrl } = req.body;
    // 检查用户是否已存在
    const [users] = await pool.query('SELECT * FROM users WHERE openid = ?', [openid]);
    
    if (users.length > 0) {
      // 用户已存在，返回用户信息
      res.json({ user: users[0] });
    } else {
      // 用户不存在，创建新用户
      const [result] = await pool.query(
        'INSERT INTO users (openid, nickname, avatar_url) VALUES (?, ?, ?)',
        [openid, nickname, avatarUrl]
      );
      // 返回新创建的用户信息
      const newUser = {
        id: result.insertId,
        openid,
        nickname,
        avatar_url: avatarUrl
      };
      res.json({ user: newUser });
    }
  } catch (err) {
    console.error('登录失败：', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 4. 创建预约（用户预约场馆）
app.post('/api/bookings', async (req, res) => {
  try {
    const { userId, venueId, date, startTime, endTime } = req.body;
    // 插入预约记录
    await pool.query(
      'INSERT INTO bookings (user_id, venue_id, date, start_time, end_time) VALUES (?, ?, ?, ?, ?)',
      [userId, venueId, date, startTime, endTime]
    );
    res.json({ message: '预约成功' });
  } catch (err) {
    console.error('预约失败：', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 5. 获取用户的预约记录
app.get('/api/bookings/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    // 查询用户的所有预约，并关联场馆名称
    const [bookings] = await pool.query(`
      SELECT b.id, v.name, b.date, b.start_time, b.end_time, b.status
      FROM bookings b
      JOIN venues v ON b.venue_id = v.id
      WHERE b.user_id = ?
    `, [userId]);
    res.json(bookings);
  } catch (err) {
    console.error('查询预约失败：', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// -------------- 启动服务器 --------------
app.listen(port, () => {
  console.log(`后端服务器已启动，地址：http://localhost:${port}`);
});