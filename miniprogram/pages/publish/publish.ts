Page({
  data: {
    categories: ['足球', '篮球', '乒乓球', '羽毛球', '排球'],
    categoryIndex: 0,
    name: '',
    time: '',
    location: '',
    price: '',
    cover: '',
    description: '',
    // 可扩展更多字段
  },
  onCategoryChange(e: any) {
    this.setData({ categoryIndex: e.detail.value });
  },
  onNameInput(e: any) {
    this.setData({ name: e.detail.value });
  },
  onTimeInput(e: any) {
    this.setData({ time: e.detail.value });
  },
  onLocationInput(e: any) {
    this.setData({ location: e.detail.value });
  },
  onPriceInput(e: any) {
    this.setData({ price: e.detail.value });
  },
  onDescInput(e: any) {
    this.setData({ description: e.detail.value });
  },
  chooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({ cover: res.tempFilePaths[0] });
      }
    });
  },
  async onSubmit() {
    const { name, categories, categoryIndex, time, location, price, cover, description } = this.data;
    if (!name || !time || !location || !price) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '发布中...' });
    // 简单处理：直接将本地图片路径作为cover字段（如需上传到服务器，可后续扩展）
    wx.request({
      url: 'http://172.16.17.253:3000/api/venues',
      method: 'POST',
      data: {
        name,
        category: categories[categoryIndex],
        business_hours: time,
        location,
        price: parseFloat(price),
        rating: 0,
        cover,
        sports: [categories[categoryIndex]],
        description,
      },
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200) {
          wx.showToast({ title: '发布成功' });
          wx.navigateBack();
        } else {
          wx.showToast({ title: '发布失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  },
});
