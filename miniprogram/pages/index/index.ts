import { venues } from '../../utils/venues';

Page({
  data: {
    venues: [] as any[],
    categories: ['足球', '篮球', '乒乓球', '羽毛球', '排球'],
    activeCategory: 0,
    filters: ['人气最高', '全城'],
  },

  onLoad() {
    this.setData({ venues });
  },

  // 顶部分类点击
  onCategoryTap(e: any) {
    const idx = e.currentTarget.dataset.idx;
    this.setData({ activeCategory: idx });
    wx.showToast({
      title: `切换到${this.data.categories[idx]}`,
      icon: 'none',
    });
    // 这里可以根据分类筛选venues数据
  },

  // 筛选栏点击
  onFilterTap(e: any) {
    const idx = e.currentTarget.dataset.idx;
    wx.showToast({
      title: `点击了${this.data.filters[idx]}`,
      icon: 'none',
    });
    // 这里可以弹出筛选菜单
  },

  // 活动室卡片点击
  navigateToDetail(e: any) {
    wx.navigateTo({
      url: `/pages/detail/detail?id=${e.currentTarget.dataset.id}`
    });
  },
});
