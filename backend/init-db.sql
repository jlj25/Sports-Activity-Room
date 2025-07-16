-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS sports_activity_room;
USE sports_activity_room;

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  openid VARCHAR(100) UNIQUE,
  username VARCHAR(100) UNIQUE,
  password VARCHAR(100),
  nickname VARCHAR(100),
  avatar_url TEXT,
  disabled BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建场馆表
CREATE TABLE IF NOT EXISTS venues (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  cover VARCHAR(500),
  business_hours VARCHAR(100),
  category VARCHAR(50) NOT NULL,
  rating DECIMAL(3,2) DEFAULT 0,
  location VARCHAR(200),
  sports JSON,
  description TEXT,
  creator_id INT NOT NULL, -- 新增字段，活动发布者
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建收藏表
CREATE TABLE IF NOT EXISTS favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  venue_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE,
  UNIQUE KEY unique_favorite (user_id, venue_id)
);

-- 创建报名表
CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  venue_id INT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE
);

-- 插入示例场馆数据
INSERT INTO venues (name, price, cover, business_hours, category, rating, location, sports) VALUES
('羽毛球馆友谊赛', 80.00, '/images/badminton.jpg', '09:00-22:00', '羽毛球', 4.8, '体育中心羽毛球馆', '["羽毛球", "友谊赛"]'),
('五人制足球夜赛', 120.00, '/images/football.jpg', '18:00-22:00', '足球', 4.9, '市体育场', '["足球", "夜赛"]'),
('篮球3V3挑战', 60.00, '/images/basketball.jpg', '14:00-20:00', '篮球', 4.7, '篮球公园', '["篮球", "3V3"]'),
('乒乓球友谊赛', 30.00, '/images/pingpong.jpg', '10:00-18:00', '乒乓球', 4.6, '社区活动中心', '["乒乓球", "友谊赛"]'),
('排球周末赛', 50.00, '/images/volleyball.jpg', '09:00-17:00', '排球', 4.5, '排球馆', '["排球", "周末"]'),
('网球单打训练', 150.00, '/images/tennis.jpg', '08:00-21:00', '网球', 4.9, '网球中心', '["网球", "单打"]'),
('游泳健身中心', 200.00, '/images/swimming.jpg', '06:00-22:00', '游泳', 4.8, '游泳馆', '["游泳", "健身"]'),
('健身房器械区', 80.00, '/images/gym.jpg', '24小时营业', '健身', 4.7, '健身中心', '["健身", "器械"]');

-- 插入示例用户数据（用于测试）
INSERT INTO users (openid, nickname, avatar_url) VALUES
('test_openid_1', '测试用户1', 'https://example.com/avatar1.jpg'),
('test_openid_2', '测试用户2', 'https://example.com/avatar2.jpg');
-- 插入账号密码用户
INSERT INTO users (username, password, nickname, avatar_url) VALUES
('user1', '123456', '账号用户1', 'https://example.com/avatar3.jpg'),
('user2', 'abcdef', '账号用户2', 'https://example.com/avatar4.jpg'); 