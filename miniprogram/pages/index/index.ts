import { venues } from '../../utils/venues';

Page({
  data: {
    venues: [] as any[],
    categories: ['全部', '足球', '篮球', '乒乓球', '羽毛球', '排球'],
    activeCategory: 0,
    filters: ['人气最高', '全城'],
    filteredVenues: [] as any[],
    searchKeyword: '',
    priceRange: [0, 1000],
    ratingRange: [0, 5],
    favoriteVenues: []
  },

  isFavorite(id: number) {
    return this.data.favoriteVenues.includes(id);
  },
  toggleFavorite(e: any) {
    const id = e.currentTarget.dataset.id;
    let favoriteVenues = this.data.favoriteVenues;
    if (this.isFavorite(id)) {
      favoriteVenues = favoriteVenues.filter((fid: number) => fid !== id);
      wx.showToast({
        title: '已取消收藏',
        icon: 'none'
      });
    } else {
      favoriteVenues.push(id);
      wx.showToast({
        title: '已收藏',
        icon: 'success'
      });
    }
    this.setData({
      favoriteVenues
    });
  },
  
  openPriceFilter() {
    wx.showActionSheet({
      itemList: ['0 - 100', '100 - 200', '200 - 500', '500以上'],
      success: (res) => {
        let min = 0;
        let max = 1000;
        switch (res.tapIndex) {
          case 0:
            min = 0;
            max = 100;
            break;
          case 1:
            min = 100;
            max = 200;
            break;
          case 2:
            min = 200;
            max = 500;
            break;
          case 3:
            min = 500;
            max = 1000;
            break;
        }
        this.setData({
          priceRange: [min, max]
        });
        this.filterVenues(this.data.activeCategory);
      }
    });
  },
  openRatingFilter() {
    wx.showActionSheet({
      itemList: ['0 - 2分', '2 - 3分', '3 - 4分', '4 - 5分'],
      success: (res) => {
        let min = 0;
        let max = 5;
        switch (res.tapIndex) {
          case 0:
            min = 0;
            max = 2;
            break;
          case 1:
            min = 2;
            max = 3;
            break;
          case 2:
            min = 3;
            max = 4;
            break;
          case 3:
            min = 4;
            max = 5;
            break;
        }
        this.setData({
          ratingRange: [min, max]
        });
        this.filterVenues(this.data.activeCategory);
      }
    });
  },
  filterVenues(idx: number) {
    let filtered = this.data.venues;
    if (idx !== 0) {
      const category = this.data.categories[idx];
      filtered = filtered.filter((v: any) => v.category === category);
    }
    const [minPrice, maxPrice] = this.data.priceRange;
    const [minRating, maxRating] = this.data.ratingRange;
    filtered = filtered.filter((v: any) => 
      v.price >= minPrice && v.price <= maxPrice &&
      v.rating >= minRating && v.rating <= maxRating
    );
    this.setData({
      filteredVenues: filtered
    });
  },

  onSearchInput(e: any) {
    this.setData({
      searchKeyword: e.detail.value
    });
  },

  onSearch() {
    const keyword = this.data.searchKeyword;
    if (keyword) {
      const filtered = this.data.venues.filter((v: any) => 
        v.name.includes(keyword) || v.category.includes(keyword)
      );
      this.setData({
        filteredVenues: filtered
      });
    } else {
      this.filterVenues(this.data.activeCategory);
    }
  },

  onLoad() {
    this.setData({ venues });
    this.filterVenues(0);
  },

  // 顶部分类点击
  onCategoryTap(e: any) {
    const idx = e.currentTarget.dataset.idx;
    this.setData({ activeCategory: idx });
    this.filterVenues(idx);
    wx.showToast({
      title: `切换到${this.data.categories[idx]}`,
      icon: 'none',
    });
  },

  // 根据分类筛选帖子
  filterVenues(idx: number) {
    if (idx === 0) {
      this.setData({ filteredVenues: this.data.venues });
    } else {
      const category = this.data.categories[idx];
      this.setData({
        filteredVenues: this.data.venues.filter((v: any) => v.category === category)
      });
    }
  },

  // 筛选栏点击
  onFilterTap(e: any) {
    const idx = e.currentTarget.dataset.idx;
    wx.showToast({
      title: `点击了${this.data.filters[idx]}`,
      icon: 'none',
    });
  },

  // 活动室卡片点击
  navigateToDetail(e: any) {
    wx.navigateTo({
      url: `/pages/detail/detail?id=${e.currentTarget.dataset.id}`
    });
  },

  // 立即预约按钮
  onReserve(e: any) {
    wx.showToast({ title: '预约功能暂未开放', icon: 'none' });
  },
});
