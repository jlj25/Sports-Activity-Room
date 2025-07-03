// my.ts
import { venues } from '../../utils/venues';

Page({
  data: {
    venues,
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
    }
  },
  onLoad() {
    // 从本地存储或后端获取收藏列表
    const favoriteVenues = wx.getStorageSync('favoriteVenues') || [];
    this.setData({
      favoriteVenues
    });
  },
  getVenueName(id: number) {
    // 根据 id 获取场馆名称
    const venue = this.data.venues.find((v: any) => v.id === id);
    return venue ? venue.name : '';
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
  }
});