// my.ts
// import { venues } from '../../utils/venues'; // 移除无效导入

Page({
  data: {
    // venues, // 移除无效数据
    favoriteVenues: [],
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
    },
    isLogin: false
  },
  onLoad() {
    // 从本地存储或后端获取收藏列表
    const favoriteVenues = wx.getStorageSync('favoriteVenues') || [];
    this.setData({
      favoriteVenues
    });
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        userInfo,
        isLogin: true
      });
    }
  },
  removeFavorite(e: any) {
    const id = e.currentTarget.dataset.id;
    let favoriteVenues = this.data.favoriteVenues;
    favoriteVenues = favoriteVenues.filter((fid: number) => fid !== id);
    this.setData({
      favoriteVenues
    });
    wx.setStorageSync('favoriteVenues', favoriteVenues);
    wx.showToast({
      title: '已移除收藏',
      icon: 'none'
    });
  },
  //登录
  onLogin() {
    wx.login({
      success: (res) => {
        if (res.code) {
          wx.getUserInfo({
            success: (userRes) => {
              wx.request({
                url: 'http://172.16.17.253:3000/api/login',
                method: 'POST',
                data: {
                  code: res.code,
                  nickname: userRes.userInfo.nickName,
                  avatarUrl: userRes.userInfo.avatarUrl
                },
                success: (loginRes: any) => {
                  if (loginRes.statusCode === 200 && loginRes.data && loginRes.data.user) {
                    this.setData({
                      userInfo: {
                        avatar: loginRes.data.user.avatar_url,
                        nickname: loginRes.data.user.nickname
                      },
                      isLogin: true
                    });
                    wx.setStorageSync('userInfo', {
                      avatar: loginRes.data.user.avatar_url,
                      nickname: loginRes.data.user.nickname
                    });
                    wx.showToast({ title: '登录成功' });
                  } else {
                    wx.showToast({ title: '登录失败', icon: 'none' });
                  }
                },
                fail: () => {
                  wx.showToast({ title: '网络错误', icon: 'none' });
                }
              });
            },
            fail: () => {
              wx.showToast({ title: '获取用户信息失败', icon: 'none' });
            }
          });
        }
      }
    });
  },
  // 跳转到我的活动页面
  goToMyActivities() {
    wx.navigateTo({
      url: '/pages/my_activities/my_activities',
    });
  },
  // 跳转到我的收藏页面
  goToMyFavorites() {
    wx.navigateTo({
      url: '/pages/my_favorites/my_favorites',
    });
  }
});