import { API_BASE_URL } from '../../utils/config';

Page({
  data: {
    venues: [] as any[],
    categories: ['全部', '足球', '篮球', '乒乓球', '羽毛球', '排球', '网球', '游泳', '健身'],
    activeCategory: 0,
    filteredVenues: [] as any[],
    searchKeyword: '',
    priceRange: [0, 1000],
    ratingRange: [0, 5],
    favoriteVenues: [] as number[],
    loading: false,
    userId: null as number | null,
    leftColumnVenues: [] as any[],
    rightColumnVenues: [] as any[],
  },

  // 检查是否收藏
  isFavorite(id: number): boolean {
    return this.data.favoriteVenues.includes(id);
  },

  // 切换收藏状态
  async toggleFavorite(e: any) {
    if (!this.data.userId) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    const venueId = e.currentTarget.dataset.id;
    let favoriteVenues = this.data.favoriteVenues;
    const isFav = favoriteVenues.includes(venueId);
    try {
      const res: any = await new Promise((resolve, reject) => {
        wx.request({
          url: `${API_BASE_URL}/favorites`,
          method: isFav ? 'DELETE' : 'POST',
          data: {
            userId: this.data.userId,
            venueId: venueId
          },
          success: resolve,
          fail: reject
        });
      });
      if (res.statusCode === 200) {
        if (isFav) {
          // 取消收藏
          favoriteVenues = favoriteVenues.filter((id: number) => id !== venueId);
          wx.showToast({ title: '已取消收藏', icon: 'none' });
        } else {
          // 添加收藏
          favoriteVenues = [...favoriteVenues, venueId];
          wx.showToast({ title: '已收藏', icon: 'success' });
        }
        this.setData({ favoriteVenues });
      } else {
        wx.showToast({ title: '操作失败', icon: 'none' });
      }
    } catch (err) {
      wx.showToast({ title: '网络错误', icon: 'none' });
    }
  },
  
  // 价格筛选
  openPriceFilter() {
    wx.showActionSheet({
      itemList: ['全部', '0 - 100', '100 - 200', '200 - 500', '500以上'],
      success: (res) => {
        let min = 0;
        let max = 1000;
        switch (res.tapIndex) {
          case 0:
            min = 0;
            max = 1000;
            break;
          case 1:
            min = 0;
            max = 100;
            break;
          case 2:
            min = 100;
            max = 200;
            break;
          case 3:
            min = 200;
            max = 500;
            break;
          case 4:
            min = 500;
            max = 1000;
            break;
        }
        this.setData({
          priceRange: [min, max]
        });
        this.fetchVenues();
      }
    });
  },

  // 评分筛选
  openRatingFilter() {
    wx.showActionSheet({
      itemList: ['全部', '0 - 2分', '2 - 3分', '3 - 4分', '4 - 5分'],
      success: (res) => {
        let min = 0;
        let max = 5;
        switch (res.tapIndex) {
          case 0:
            min = 0;
            max = 5;
            break;
          case 1:
            min = 0;
            max = 2;
            break;
          case 2:
            min = 2;
            max = 3;
            break;
          case 3:
            min = 3;
            max = 4;
            break;
          case 4:
            min = 4;
            max = 5;
            break;
        }
        this.setData({
          ratingRange: [min, max]
        });
        this.fetchVenues();
      }
    });
  },

  // 将活动数据分成左右两列
  splitVenuesIntoColumns(venues: any[]) {
    const leftColumn: any[] = [];
    const rightColumn: any[] = [];
    
    venues.forEach((venue, index) => {
      if (index % 2 === 0) {
        leftColumn.push(venue);
      } else {
        rightColumn.push(venue);
      }
    });
    
    this.setData({
      leftColumnVenues: leftColumn,
      rightColumnVenues: rightColumn
    });
  },

  // 从后端获取场馆数据
  async fetchVenues() {
    this.setData({ loading: true });
    
    try {
      const params: any = {};
      
      // 搜索关键词
      if (this.data.searchKeyword) {
        params.search = this.data.searchKeyword;
      }
      
      // 分类筛选
      if (this.data.activeCategory !== 0) {
        params.category = this.data.categories[this.data.activeCategory];
      }
      
      // 价格筛选
      const [minPrice, maxPrice] = this.data.priceRange;
      if (minPrice > 0) params.priceMin = minPrice;
      if (maxPrice < 1000) params.priceMax = maxPrice;
      
      // 评分筛选
      const [minRating, maxRating] = this.data.ratingRange;
      if (minRating > 0) params.ratingMin = minRating;
      if (maxRating < 5) params.ratingMax = maxRating;
      
      const res: any = await new Promise((resolve, reject) => {
        wx.request({
          url: `${API_BASE_URL}/venues`,
          method: 'GET',
          data: params,
          success: resolve,
          fail: reject
        });
      });

      if (res.statusCode === 200) {
        // 处理sports字段（从JSON字符串转换为数组）
        const venues = res.data.map((venue: any) => ({
          ...venue,
          sports: typeof venue.sports === 'string' ? JSON.parse(venue.sports) : venue.sports
        }));
        
        this.setData({
          venues: venues,
          filteredVenues: venues
        });
        
        // 将活动分成左右两列
        this.splitVenuesIntoColumns(venues);
      }
    } catch (error) {
      console.error('获取场馆数据失败:', error);
      wx.showToast({
        title: '获取数据失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 搜索输入
  onSearchInput(e: any) {
    this.setData({
      searchKeyword: e.detail.value
    });
  },

  // 搜索按钮
  onSearch() {
    this.fetchVenues();
  },

  // 页面加载
  onLoad() {
    // 移除 mockLogin 相关内容，首页只依赖真实登录
    this.fetchVenues();
  },

  // 获取用户收藏
  async fetchFavorites() {
    if (!this.data.userId) return;
    
    try {
      const res: any = await new Promise((resolve, reject) => {
        wx.request({
          url: `${API_BASE_URL}/favorites/${this.data.userId}`,
          method: 'GET',
          success: resolve,
          fail: reject
        });
      });

      if (res.statusCode === 200) {
        const favoriteIds = res.data.map((venue: any) => venue.id);
        this.setData({ favoriteVenues: favoriteIds });
      }
    } catch (error) {
      console.error('获取收藏失败:', error);
    }
  },

  // 顶部分类点击
  onCategoryTap(e: any) {
    const idx = e.currentTarget.dataset.idx;
    this.setData({ activeCategory: idx });
    this.fetchVenues();
    wx.showToast({
      title: `切换到${this.data.categories[idx]}`,
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
    if (!this.data.userId) {
      wx.showToast({ 
        title: '请先登录', 
        icon: 'none' 
      });
      return;
    }
    
    const venueId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/publish/publish?venueId=${venueId}`
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.fetchVenues().then(() => {
      wx.stopPullDownRefresh();
    });
  }
});
