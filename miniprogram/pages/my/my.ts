// my.ts
Page({
  data: {
    bookings: [
      {
        id: 1,
        venueName: '羽毛球馆',
        date: '2024-05-20',
        time: '19:00-21:00'
      }
    ],
    userInfo: {
      avatar: '/images/default_avatar.png',
      nickname: '未登录',
    }
  },
  onLoad() {
    // 这里可以请求用户信息
  }
})