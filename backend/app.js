const express = require('express');
const cors = require('cors');
const pool = require('./db'); // 导入数据库连接池
const axios = require('axios'); // 新增
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// 设置multer存储配置
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: function (req, file, cb) {
    // 保证文件名唯一
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, basename + '-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage });

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
    const { search, category, priceMin, priceMax, ratingMin, ratingMax } = req.query;
    
    let sql = 'SELECT * FROM venues WHERE 1=1';
    const params = [];
    
    // 搜索功能
    if (search) {
      sql += ' AND (name LIKE ? OR location LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    // 分类筛选
    if (category && category !== '全部') {
      sql += ' AND category = ?';
      params.push(category);
    }
    
    // 价格筛选
    if (priceMin !== undefined) {
      sql += ' AND price >= ?';
      params.push(parseFloat(priceMin));
    }
    if (priceMax !== undefined) {
      sql += ' AND price <= ?';
      params.push(parseFloat(priceMax));
    }
    
    // 评分筛选
    if (ratingMin !== undefined) {
      sql += ' AND rating >= ?';
      params.push(parseFloat(ratingMin));
    }
    if (ratingMax !== undefined) {
      sql += ' AND rating <= ?';
      params.push(parseFloat(ratingMax));
    }
    
    // 从数据库查询场馆
    const [venues] = await pool.query(sql, params);
    res.json(venues); // 返回场馆列表给前端
  } catch (err) {
    console.error('查询场馆失败：', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 3. 获取单个场馆详情
app.get('/api/venues/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [venues] = await pool.query('SELECT * FROM venues WHERE id = ?', [id]);
    
    if (venues.length === 0) {
      return res.status(404).json({ message: '场馆不存在' });
    }
    
    res.json(venues[0]);
  } catch (err) {
    console.error('查询场馆详情失败：', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 微信授权登录接口（标准版：后端用 code 换 openid）
const WX_APPID = 'wx5faaae7883060a81'; // TODO: 替换为你的AppID
const WX_SECRET = '21e2ee4d357218713446b60f54d2050e'; // TODO: 替换为你的AppSecret

app.post('/api/login', async (req, res) => {
  const { code, nickname, avatarUrl } = req.body;
  if (!code) return res.status(400).json({ error: '缺少code' });
  try {
    // 1. 用 code 换 openid
    const wxResp = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
      params: {
        appid: WX_APPID,
        secret: WX_SECRET,
        js_code: code,
        grant_type: 'authorization_code'
      }
    });
    const { openid } = wxResp.data;
    if (!openid) return res.status(400).json({ error: 'code无效', detail: wxResp.data });

    // 2. 查找/注册用户
    const [rows] = await pool.query('SELECT * FROM users WHERE openid = ?', [openid]);
    let user;
    if (rows.length > 0) {
      user = rows[0];
      // 更新昵称和头像
      await pool.query('UPDATE users SET nickname = ?, avatar_url = ? WHERE openid = ?', [nickname, avatarUrl, openid]);
    } else {
      // 新用户注册
      const [result] = await pool.query('INSERT INTO users (openid, nickname, avatar_url) VALUES (?, ?, ?)', [openid, nickname, avatarUrl]);
      user = { id: result.insertId, openid, nickname, avatar_url: avatarUrl };
    }
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: '服务器错误', detail: err.message });
  }
});

// 5. 收藏/取消收藏场馆
app.post('/api/favorites', async (req, res) => {
  try {
    const { userId, venueId } = req.body;
    
    // 检查是否已收藏
    const [existing] = await pool.query(
      'SELECT * FROM favorites WHERE user_id = ? AND venue_id = ?',
      [userId, venueId]
    );
    
    if (existing.length > 0) {
      // 已收藏，取消收藏
      await pool.query(
        'DELETE FROM favorites WHERE user_id = ? AND venue_id = ?',
        [userId, venueId]
      );
      res.json({ message: '已取消收藏', isFavorite: false });
    } else {
      // 未收藏，添加收藏
      await pool.query(
        'INSERT INTO favorites (user_id, venue_id) VALUES (?, ?)',
        [userId, venueId]
      );
      res.json({ message: '已收藏', isFavorite: true });
    }
  } catch (err) {
    console.error('收藏操作失败：', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 6. 获取用户收藏的场馆
app.get('/api/favorites/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const [favorites] = await pool.query(`
      SELECT v.* FROM venues v
      JOIN favorites f ON v.id = f.venue_id
      WHERE f.user_id = ?
    `, [userId]);
    res.json(favorites);
  } catch (err) {
    console.error('查询收藏失败：', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 7. 新增活动（场馆）
app.post('/api/venues', async (req, res) => {
  try {
    const { name, price, cover, business_hours, category, rating, location, sports, description, creator_id } = req.body;
    if (!creator_id) return res.status(400).json({ message: '缺少creator_id' });
    const [result] = await pool.query(
      'INSERT INTO venues (name, price, cover, business_hours, category, rating, location, sports, description, creator_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, price, cover, business_hours, category, rating || 0, location, JSON.stringify(sports || []), description, creator_id]
    );
    res.json({ id: result.insertId, message: '活动创建成功' });
  } catch (err) {
    console.error('新增活动失败：', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 8. 编辑活动（场馆）
app.put('/api/venues/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, cover, business_hours, category, rating, location, sports, description, creator_id } = req.body;
    if (!creator_id) return res.status(400).json({ message: '缺少creator_id' });
    const [result] = await pool.query(
      'UPDATE venues SET name=?, price=?, cover=?, business_hours=?, category=?, rating=?, location=?, sports=?, description=?, creator_id=? WHERE id=?',
      [name, price, cover, business_hours, category, rating || 0, location, JSON.stringify(sports || []), description, creator_id, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '活动不存在' });
    }
    res.json({ message: '活动更新成功' });
  } catch (err) {
    console.error('编辑活动失败：', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 9. 删除活动（场馆）
app.delete('/api/venues/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM venues WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '活动不存在' });
    }
    res.json({ message: '活动删除成功' });
  } catch (err) {
    console.error('删除活动失败：', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取某用户发布的活动
app.get('/api/my_venues/:creator_id', async (req, res) => {
  try {
    const { creator_id } = req.params;
    const [venues] = await pool.query('SELECT * FROM venues WHERE creator_id = ?', [creator_id]);
    res.json(venues);
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取某活动的评论（带楼中楼结构）
app.get('/api/comments/:venueId', async (req, res) => {
  const { venueId } = req.params;
  // 查询所有评论及用户信息
  const [rows] = await pool.query(
    `SELECT c.*, u.nickname, u.avatar_url FROM comments c JOIN users u ON c.user_id = u.id WHERE c.venue_id = ? ORDER BY c.created_at ASC`,
    [venueId]
  );
  // 构建楼中楼结构
  const commentMap = {};
  rows.forEach(c => { c.replies = []; commentMap[c.id] = c; });
  const rootComments = [];
  rows.forEach(c => {
    if (c.parent_id) {
      if (commentMap[c.parent_id]) commentMap[c.parent_id].replies.push(c);
    } else {
      rootComments.push(c);
    }
  });
  res.json(rootComments);
});

// 发布评论/回复
app.post('/api/comments', async (req, res) => {
  const { venue_id, user_id, content, parent_id, reply_to_user_id } = req.body;
  if (!venue_id || !user_id || !content) return res.status(400).json({ message: '参数不全' });
  await pool.query(
    'INSERT INTO comments (venue_id, user_id, content, parent_id, reply_to_user_id) VALUES (?, ?, ?, ?, ?)',
    [venue_id, user_id, content, parent_id || null, reply_to_user_id || null]
  );
  res.json({ message: '评论成功' });
});

// 删除评论（仅本人或管理员可删）
app.delete('/api/comments/:id', async (req, res) => {
  const { id } = req.params;
  // 这里简单实现：直接删除（如需权限校验可扩展）
  await pool.query('DELETE FROM comments WHERE id = ?', [id]);
  res.json({ message: '删除成功' });
});

// 图片上传接口
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: '未收到文件' });
  }
  // 构造图片URL（假设前端通过http://服务器地址:端口/uploads/xxx.jpg访问）
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

// 静态资源托管uploads目录
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// -------------- 启动服务器 --------------
app.listen(port, '0.0.0.0', () => {  // 关键修改：监听 0.0.0.0
  console.log(`后端服务器已启动，局域网访问地址：http://${getLocalIpAddress()}:${port}`);
  console.log(`本机访问地址：http://localhost:${port}`);
});

// 获取本机局域网 IP 的辅助函数（可选）
function getLocalIpAddress() {
  const interfaces = require('os').networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal && iface.address.startsWith('192.168')) {
        return iface.address;
      }
    }
  }
  return '0.0.0.0';
}