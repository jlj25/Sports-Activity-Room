import { API_BASE_URL } from '../../utils/config';

// detail.ts
Page({
  data: {
    venueInfo: {
      id: 0,
      name: '',
      price: 0,
      cover: '',
      businessHours: '',
      category: '',
      rating: 0,
      location: '',
      sports: [],
      description: ''
    },
    selectedTime: '',
    selectedRating: 3,
    comment: '',
    loading: true
  },

  onLoad(options: any) {
    if (options.id) {
      this.fetchVenueDetail(options.id);
    }
  },

  // 获取场馆详情
  async fetchVenueDetail(venueId: string) {
    try {
      const res: any = await new Promise((resolve, reject) => {
        wx.request({
          url: `${API_BASE_URL}/venues/${venueId}`,
          method: 'GET',
          success: resolve,
          fail: reject
        });
      });

      if (res.statusCode === 200) {
        const venue = res.data;
        // 处理sports字段
        if (typeof venue.sports === 'string') {
          venue.sports = JSON.parse(venue.sports);
        }
        
        this.setData({
          venueInfo: venue,
          loading: false
        });
      } else {
        wx.showToast({
          title: '获取场馆信息失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('获取场馆详情失败:', error);
      wx.showToast({
        title: '获取数据失败',
        icon: 'none'
      });
    }
  },

  onRatingChange(e: any) {
    this.setData({
      selectedRating: parseInt(e.detail.value) + 1
    });
  },

  onCommentInput(e: any) {
    this.setData({
      comment: e.detail.value
    });
  },

  submitComment() {
    const { selectedRating, comment } = this.data;
    if (comment) {
      // 提交评论和评分到后端或本地存储
      wx.showToast({
        title: '评论提交成功',
        icon: 'success'
      });
      this.setData({
        comment: ''
      });
    } else {
      wx.showToast({
        title: '请输入评论内容',
        icon: 'none'
      });
    }
  },
  
  selectTime(e: any) {
    this.setData({ selectedTime: e.detail.value })
  },

  handleBooking() {
    wx.showToast({
      title: '预约成功：' + this.data.selectedTime,
      icon: 'success'
    })
  }
})