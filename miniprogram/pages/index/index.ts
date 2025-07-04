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
    userId: null as number | null
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
    
    try {
      const res: any = await new Promise((resolve, reject) => {
        wx.request({
          url: `${API_BASE_URL}/favorites`,
          method: 'POST',
          data: {
            userId: this.data.userId,
            venueId: venueId
          },
          success: resolve,
          fail: reject
        });
      });

      if (res.statusCode === 200) {
        let favoriteVenues = this.data.favoriteVenues;
        if (res.data.isFavorite) {
          favoriteVenues.push(venueId);
          wx.showToast({
            title: '已收藏',
            icon: 'success'
          });
        } else {
          favoriteVenues = favoriteVenues.filter(id => id !== venueId);
          wx.showToast({
            title: '已取消收藏',
            icon: 'none'
          });
        }
        this.setData({ favoriteVenues });
      }
    } catch (error) {
      console.error('收藏操作失败:', error);
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      });
    }
  },
  
  // 价格筛选
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
        this.fetchVenues();
      }
    });
  },

  // 评分筛选
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
        this.fetchVenues();
      }
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
    // 模拟用户登录（实际项目中应该通过微信登录获取openid）
    this.mockLogin();
    this.fetchVenues();
  },

  // 模拟用户登录
  async mockLogin() {
    try {
      const res: any = await new Promise((resolve, reject) => {
        wx.request({
          url: `${API_BASE_URL}/login`,
          method: 'POST',
          data: {
            openid: 'test_openid_1',
            nickname: '测试用户',
            avatarUrl: 'https://example.com/avatar.jpg'
          },
          success: resolve,
          fail: reject
        });
      });

      if (res.statusCode === 200) {
        this.setData({ userId: res.data.user.id });
        this.fetchFavorites();
      }
    } catch (error) {
      console.error('登录失败:', error);
    }
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
