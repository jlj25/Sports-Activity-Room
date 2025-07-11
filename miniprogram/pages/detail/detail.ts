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
    loading: true,
    comments: [] as any[],
    commentInput: '',
    replying: false,
    replyToCommentId: null as number | null,
    replyToUserId: null as number | null,
    replyToNickname: '',
    replyPlaceholder: '说点什么...'
  },

  onLoad(options: any) {
    if (options.id) {
      this.fetchVenueDetail(options.id);
      this.fetchComments(options.id);
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
        
        // 在设置venueInfo前修正cover字段
        let cover = venue.cover;
        if (cover && !/^https?:\/\//.test(cover) && cover) {
          cover = '../../images/' + cover;
        }
        venue.cover = cover;

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
    wx.request({
      url: `${API_BASE_URL}/comments`,
      method: 'POST',
      data: {
        venue_id: this.data.venueInfo.id,
        user_id: userInfo.id,
        content: this.data.commentInput,
        parent_id: this.data.replyToCommentId,
        reply_to_user_id: this.data.replyToUserId
      },
      success: () => {
        wx.showToast({ title: '评论成功' });
        this.setData({ commentInput: '', replying: false, replyToCommentId: null, replyToUserId: null, replyToNickname: '', replyPlaceholder: '说点什么...' });
        this.fetchComments(this.data.venueInfo.id);
      }
    });
  },
  
  selectTime(e: any) {
    this.setData({ selectedTime: e.detail.value })
  },

  handleBooking() {
    wx.showToast({
      title: '预约成功：' + this.data.selectedTime,
      icon: 'success'
    })
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
                this.fetchComments(this.data.venueInfo.id);
              } else {
                wx.showToast({ title: '删除失败', icon: 'none' });
              }
            }
          });
        }
      }
    });
  },

  // 新增：删除活动
  deleteVenue() {
    const { id } = this.data.venueInfo;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除该活动吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' });
          wx.request({
            url: `${API_BASE_URL}/venues/${id}`,
            method: 'DELETE',
            success: (delRes) => {
              wx.hideLoading();
              if (delRes.statusCode === 200) {
                wx.showToast({ title: '删除成功' });
                wx.navigateBack();
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
})