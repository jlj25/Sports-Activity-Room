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
    currentView: 'list',
    selectedVenue: {} as any,
    comments: [] as any[],
    commentInput: '',
    replying: false,
    replyToCommentId: null as number | null,
    replyToUserId: null as number | null,
    replyToNickname: '',
    replyPlaceholder: '说点什么...'
  },

  // 检查是否收藏
  isFavorite(id: number): boolean {
    return this.data.favoriteVenues.includes(id);
  },

  // 切换收藏状态（首页卡片）
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
    // 立即切换UI和本地缓存
    let newFavorites;
    if (isFav) {
      newFavorites = favoriteVenues.filter((id: number) => id !== venueId);
    } else {
      newFavorites = [...favoriteVenues, venueId];
    }
    console.log('收藏前:', favoriteVenues, '收藏后:', newFavorites, '当前id:', venueId, 'isFav:', isFav);
    this.setData({ favoriteVenues: newFavorites });
    wx.setStorageSync('favoriteVenues', newFavorites);
    this.splitVenuesIntoColumns(this.data.venues);
    // 请求后端
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
        wx.showToast({ title: isFav ? '已取消收藏' : '已收藏', icon: isFav ? 'none' : 'success' });
      } else {
        // 回滚
        this.setData({ favoriteVenues: favoriteVenues });
        wx.setStorageSync('favoriteVenues', favoriteVenues);
        wx.showToast({ title: '操作失败', icon: 'none' });
      }
    } catch (err) {
      // 回滚
      this.setData({ favoriteVenues: favoriteVenues });
      wx.setStorageSync('favoriteVenues', favoriteVenues);
      wx.showToast({ title: '网络错误', icon: 'none' });
    }
  },

  // 详情页收藏按钮
  toggleFavoriteDetail() {
    if (!this.data.userId) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    const venueId = this.data.selectedVenue.id;
    let favoriteVenues = this.data.favoriteVenues;
    const isFav = favoriteVenues.includes(venueId);
    // 立即切换UI和本地缓存
    let newFavorites;
    if (isFav) {
      newFavorites = favoriteVenues.filter((id: number) => id !== venueId);
    } else {
      newFavorites = [...favoriteVenues, venueId];
    }
    this.setData({ favoriteVenues: newFavorites });
    wx.setStorageSync('favoriteVenues', newFavorites);
    this.splitVenuesIntoColumns(this.data.venues);
    // 请求后端
    wx.request({
      url: `${API_BASE_URL}/favorites`,
      method: 'POST',
      data: {
        userId: this.data.userId,
        venueId: venueId
      },
      success: (res) => {
        if (res.statusCode === 200) {
          wx.showToast({ title: isFav ? '已取消收藏' : '已收藏', icon: isFav ? 'none' : 'success' });
        } else {
          // 回滚
          this.setData({ favoriteVenues: favoriteVenues });
          wx.setStorageSync('favoriteVenues', favoriteVenues);
          wx.showToast({ title: '操作失败', icon: 'none' });
        }
      },
      fail: () => {
        // 回滚
        this.setData({ favoriteVenues: favoriteVenues });
        wx.setStorageSync('favoriteVenues', favoriteVenues);
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
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
    this.fetchVenues();
    // 同步userId
    const userInfo = wx.getStorageSync('userInfo');
    this.setData({
      userId: userInfo && userInfo.id ? userInfo.id : null
    });
  },

  // 页面显示时同步本地收藏和userId
  onShow() {
    const favoriteVenues = wx.getStorageSync('favoriteVenues') || [];
    const userInfo = wx.getStorageSync('userInfo');
    this.setData({
      favoriteVenues,
      userId: userInfo && userInfo.id ? userInfo.id : null
    });
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

  // 立即报名按钮
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
  },

  // 切换到详情
  showVenueDetail(e: any) {
    const id = e.currentTarget.dataset.id;
    this.fetchVenueDetail(id);
    this.fetchComments(id);
    this.setData({ currentView: 'detail' });
  },
  // 返回列表
  backToList() {
    this.setData({ currentView: 'list', selectedVenue: {}, comments: [] });
  },
  // 获取详情
  fetchVenueDetail(id: number) {
    wx.request({
      url: `${API_BASE_URL}/venues/${id}`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200) {
          const venue = res.data as any;
          if (typeof venue.sports === 'string') venue.sports = JSON.parse(venue.sports);
          let cover = venue.cover;
          if (cover && !/^https?:\/\//.test(cover) && cover) {
            cover = '../../images/' + cover;
          }
          venue.cover = cover;
          this.setData({ selectedVenue: venue });
        }
      }
    });
  },
  // 评论相关逻辑
  onCommentInput(e: any) {
    this.setData({ commentInput: e.detail.value });
  },
  submitComment() {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo || !userInfo.id) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    if (!this.data.commentInput.trim()) {
      wx.showToast({ title: '请输入内容', icon: 'none' });
      return;
    }
    const venue = this.data.selectedVenue as any;
    wx.request({
      url: `${API_BASE_URL}/comments`,
      method: 'POST',
      data: {
        venue_id: venue.id,
        user_id: userInfo.id,
        content: this.data.commentInput,
        parent_id: this.data.replyToCommentId,
        reply_to_user_id: this.data.replyToUserId
      },
      success: () => {
        wx.showToast({ title: '评论成功' });
        this.setData({ commentInput: '', replying: false, replyToCommentId: null, replyToUserId: null, replyToNickname: '', replyPlaceholder: '说点什么...' });
        this.fetchComments(venue.id);
      }
    });
  },
  onReplyComment(e: any) {
    const { id, nickname, userid } = e.currentTarget.dataset;
    this.setData({
      replying: true,
      replyToCommentId: id,
      replyToUserId: userid,
      replyToNickname: nickname,
      replyPlaceholder: `回复 @${nickname}：`
    });
  },
  cancelReply() {
    this.setData({ replying: false, replyToCommentId: null, replyToUserId: null, replyToNickname: '', replyPlaceholder: '说点什么...' });
  },
  onDeleteComment(e: any) {
    const id = e.currentTarget.dataset.id;
    const venue = this.data.selectedVenue as any;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除该评论吗？',
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: `${API_BASE_URL}/comments/${id}`,
            method: 'DELETE',
            success: (delRes) => {
              if (delRes.statusCode === 200) {
                wx.showToast({ title: '删除成功' });
                this.fetchComments(venue.id);
              } else {
                wx.showToast({ title: '删除失败', icon: 'none' });
              }
            }
          });
        }
      }
    });
  },
  fetchComments(venueId: number) {
    wx.request({
      url: `${API_BASE_URL}/comments/${venueId}`,
      method: 'GET',
      success: (res) => {
        const data = res.data as any[];
        // 处理@昵称
        const fillReplyNickname = (list: any[]) => {
          list.forEach(c => {
            if (c.reply_to_user_id && c.reply_to_user_id !== c.user_id) {
              c.reply_to_nickname = c.reply_to_nickname || (c.replies && c.replies.length && c.replies[0].nickname) || '';
            }
            if (c.replies && c.replies.length) fillReplyNickname(c.replies);
          });
        };
        fillReplyNickname(data || []);
        this.setData({ comments: data || [] });
      }
    });
  }
});
