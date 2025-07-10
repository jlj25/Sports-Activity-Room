// 我的活动页面
import { API_BASE_URL } from '../../utils/config';

Page({
  data: {
    activities: [] as any[]
  },
  onLoad() {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    // 获取当前用户发布的活动（假设后端 venues 表有 user_openid 字段，实际可根据需求调整）
    wx.request({
      url: `${API_BASE_URL}/venues`,
      method: 'GET',
      data: { user_openid: userInfo.openid },
      success: (res) => {
        if (res.statusCode === 200) {
          let activities: any[] = [];
          if (Array.isArray(res.data)) {
            activities = res.data;
          } else if (typeof res.data === 'string') {
            try {
              activities = JSON.parse(res.data);
              if (!Array.isArray(activities)) activities = [];
            } catch (e) {
              activities = [];
            }
          } else if (res.data && typeof res.data === 'object') {
            activities = [res.data];
          }
          this.setData({ activities });
        }
      }
    });
  },
  goToDetail(e: any) {
    const id = e.currentTarget.dataset.id;
    wx.showToast({ title: '点击id:' + id, icon: 'none' }); // 调试用
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  }
});
