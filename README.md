# 运动活动室小程序

一个基于微信小程序的运动场馆预约平台，支持场馆浏览、搜索、筛选、收藏和预约功能。

## 项目结构

```
Sports_Activity_Room/
├── backend/                 # 后端服务器
│   ├── app.js              # 主服务器文件
│   ├── db.js               # 数据库连接
│   ├── init-db.sql         # 数据库初始化脚本
│   ├── package.json        # 后端依赖
│   └── env.example         # 环境变量示例
├── miniprogram/            # 微信小程序前端
│   ├── pages/              # 页面文件
│   │   ├── index/          # 首页
│   │   ├── detail/         # 详情页
│   │   ├── publish/        # 发布页
│   │   └── my/             # 我的页面
│   ├── utils/              # 工具文件
│   │   ├── config.ts       # 配置文件
│   │   └── venues.ts       # 场馆数据
│   └── app.ts              # 小程序入口
└── README.md               # 项目说明
```

## 功能特性

### 前端功能
- 🏟️ 场馆列表展示
- 🔍 搜索和筛选功能
- ❤️ 收藏场馆
- 📅 场馆预约
- 👤 用户个人中心

### 后端API
- `GET /api/venues` - 获取场馆列表（支持搜索、筛选）
- `GET /api/venues/:id` - 获取场馆详情
- `POST /api/login` - 用户登录
- `POST /api/favorites` - 收藏/取消收藏
- `GET /api/favorites/:userId` - 获取用户收藏
- `POST /api/bookings` - 创建预约
- `GET /api/bookings/:userId` - 获取用户预约记录

## 快速开始

### 1. 环境准备

确保你的系统已安装：
- Node.js (v14+)
- MySQL (v8.0+)
- 微信开发者工具

### 2. 数据库设置

1. 创建MySQL数据库
2. 复制 `backend/env.example` 为 `backend/.env`
3. 修改数据库连接信息
4. 执行数据库初始化脚本：

```sql
mysql -u root -p < backend/init-db.sql
```

### 3. 启动后端服务

```bash
cd backend
npm install
npm start
```

后端服务将在 `http://192.168.43.222` 启动

### 4. 配置小程序

1. 在微信开发者工具中打开项目
2. 修改 `miniprogram/utils/config.ts` 中的API地址
3. 在开发者工具中设置不校验合法域名（开发阶段）

### 5. 测试API

访问 `http://192.168.43.222:3000/api/test` 确认后端服务正常

## 开发说明

### 数据库表结构

- `users` - 用户表
- `venues` - 场馆表
- `favorites` - 收藏表
- `bookings` - 预约表

### 前端开发

- 使用TypeScript开发
- 页面数据通过API动态获取
- 支持下拉刷新和搜索筛选

### 后端开发

- 基于Express.js框架
- 使用MySQL数据库
- 支持CORS跨域请求
- RESTful API设计

## 部署说明

### 生产环境配置

1. 修改API地址为生产服务器地址
2. 配置HTTPS证书
3. 在微信小程序后台配置服务器域名
4. 设置数据库连接池参数

### 数据库备份

```bash
mysqldump -u root -p sports_activity_room > backup.sql
```

## 常见问题

### Q: 小程序无法连接后端？
A: 检查网络连接，确保后端服务正常运行，开发阶段可在开发者工具中关闭域名校验。

### Q: 数据库连接失败？
A: 检查数据库服务是否启动，确认.env文件中的连接信息正确。

### Q: API返回500错误？
A: 查看后端控制台日志，检查数据库表是否创建成功。

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交代码
4. 创建Pull Request

## 许可证

MIT License 