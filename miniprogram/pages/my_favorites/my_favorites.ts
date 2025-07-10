// 我的收藏页面
import { API_BASE_URL } from '../../utils/config';

Page({
  data: {
    favorites: [] as any[]
  },
  onLoad() {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    // 获取当前用户收藏的活动
    wx.request({
      url: `${API_BASE_URL}/favorites/${userInfo.id}`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200) {
          let favorites: any[] = [];
          if (Array.isArray(res.data)) {
            favorites = res.data;
          } else if (typeof res.data === 'string') {
            try {
              favorites = JSON.parse(res.data);
              if (!Array.isArray(favorites)) favorites = [];
            } catch (e) {
              favorites = [];
            }
          } else if (res.data && typeof res.data === 'object') {
            favorites = [res.data];
          }
          this.setData({ favorites });
        }
      }
    });
  },
  goToDetail(e: any) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  }
});
