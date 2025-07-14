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
      openid: '', // 新增，初始为空
      id: null as number | null // 新增，初始为null
    },
    isLogin: false,
    showMyActivitiesModal: false,
    myActivities: [] as any[],
    showMyFavoritesModal: false,
    myFavorites: [] as any[],
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
  onShow() {
    // 每次页面显示都同步本地userInfo和收藏，保证登录和收藏状态
    const userInfo = wx.getStorageSync('userInfo');
    const favoriteVenues = wx.getStorageSync('favoriteVenues') || [];
    if (userInfo && userInfo.id) {
      this.setData({
        userInfo,
        isLogin: true,
        favoriteVenues
      });
    } else {
      this.setData({
        userInfo: {
          avatar: '/images/default_avatar.png',
          nickname: '未登录',
          openid: '',
          id: null
        },
        isLogin: false,
        favoriteVenues
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
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (userRes) => {
        wx.login({
          success: (res) => {
            if (res.code) {
              wx.request({
                url: 'http://192.168.43.222:3000/api/login',
                method: 'POST',
                data: {
                  code: res.code,
                  nickname: userRes.userInfo.nickName,
                  avatarUrl: userRes.userInfo.avatarUrl
                },
                success: (loginRes: any) => {
                  if (loginRes.statusCode === 200 && loginRes.data && loginRes.data.user) {
                    const user = loginRes.data.user;
                    this.setData({
                      userInfo: {
                        avatar: user.avatar_url,
                        nickname: user.nickname,
                        openid: user.openid,
                        id: user.id
                      },
                      isLogin: true
                    });
                    wx.setStorageSync('userInfo', {
                      avatar: user.avatar_url,
                      nickname: user.nickname,
                      openid: user.openid,
                      id: user.id
                    });
                    wx.showToast({ title: '登录成功' });
                    if (typeof this.onShow === 'function') this.onShow();
                  } else {
                    wx.showToast({ title: '登录失败', icon: 'none' });
                  }
                },
                fail: () => {
                  wx.showToast({ title: '网络错误', icon: 'none' });
                }
              });
            }
          }
        });
      },
      fail: (err) => {
        console.log('getUserProfile fail', err);
        wx.showToast({ title: '获取微信信息失败', icon: 'none' });
      }
    });
  },
  onGetUserInfo(e: any) {
    wx.showToast({ title: '请点击上方“登录”按钮', icon: 'none' });
  },
  openMyActivitiesModal() {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo || !userInfo.id) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    wx.request({
      url: `http://192.168.43.222:3000/api/my_venues/${userInfo.id}`,
      method: 'GET',
      success: (res) => {
        this.setData({
          myActivities: Array.isArray(res.data) ? res.data : [],
          showMyActivitiesModal: true
        });
      }
    });
  },
  closeMyActivitiesModal() {
    this.setData({ showMyActivitiesModal: false });
  },
  goToEditFromModal(e: any) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/publish/publish?id=${id}` });
  },
  deleteActivityFromModal(e: any) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除该活动吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' });
          wx.request({
            url: `http://192.168.43.222:3000/api/venues/${id}`,
            method: 'DELETE',
            success: (delRes) => {
              wx.hideLoading();
              if (delRes.statusCode === 200) {
                wx.showToast({ title: '删除成功' });
                // 重新拉取
                this.openMyActivitiesModal();
              } else {
                wx.showToast({ title: '删除失败', icon: 'none' });
              }
            },
            fail: () => {
              wx.hideLoading();
              wx.showToast({ title: '网络错误', icon: 'none' });
            }
          });
        }
      }
    });
  },
  openMyFavoritesModal() {
    const userInfo = wx.getStorageSync('userInfo');
    const favoriteVenues = wx.getStorageSync('favoriteVenues') || [];
    if (!userInfo || !userInfo.id) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    wx.request({
      url: `http://192.168.43.222:3000/api/favorites/${userInfo.id}`,
      method: 'GET',
      success: (res) => {
        this.setData({
          myFavorites: Array.isArray(res.data) ? res.data : [],
          showMyFavoritesModal: true,
          favoriteVenues // 保证同步
        });
      }
    });
  },
  closeMyFavoritesModal() {
    this.setData({ showMyFavoritesModal: false });
  },
  removeFavoriteFromModal(e: any) {
    const id = e.currentTarget.dataset.id;
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo || !userInfo.id) return;
    wx.request({
      url: `http://192.168.43.222:3000/api/favorites`,
      method: 'POST',
      data: { userId: userInfo.id, venueId: id },
      success: (res) => {
        let data = res.data;
        if (typeof data === 'string') {
          try { data = JSON.parse(data); } catch (e) { data = {}; }
        }
        if (res.statusCode === 200 && typeof data === 'object' && data !== null && 'isFavorite' in data && data.isFavorite === false) {
          wx.showToast({ title: '已移除收藏', icon: 'none' });
          // 刷新本地缓存
          let favoriteVenues = wx.getStorageSync('favoriteVenues') || [];
          favoriteVenues = favoriteVenues.filter((fid: number) => fid !== id);
          wx.setStorageSync('favoriteVenues', favoriteVenues);
          this.setData({ favoriteVenues });
          this.openMyFavoritesModal();
        }
      }
    });
  }
});