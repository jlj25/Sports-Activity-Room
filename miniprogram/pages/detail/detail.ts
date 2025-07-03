// detail.ts
Page({
  data: {
    venueInfo: {
      id: 1,
      name: '羽毛球馆',
      price: 80,
      cover: '/images/badminton.jpg',
      businessHours: '09:00-22:00'
    },
    selectedTime: '',
    selectedRating: 3,
    comment: ''
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