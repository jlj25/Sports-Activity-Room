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
    selectedTime: ''
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