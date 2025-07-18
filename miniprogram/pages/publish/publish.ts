Page({
  data: {
    categories: ['足球', '篮球', '乒乓球', '羽毛球', '排球'],
    categoryIndex: 0,
    name: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    price: '',
    cover: '',
    description: '',
    editId: null as number | null // 新增，支持编辑
  },
  onCategoryChange(e: any) {
    this.setData({ categoryIndex: e.detail.value });
  },
  onNameInput(e: any) {
    this.setData({ name: e.detail.value });
  },
  onDateChange(e: any) {
    this.setData({ date: e.detail.value });
  },
  onStartTimeChange(e: any) {
    this.setData({ startTime: e.detail.value });
  },
  onEndTimeChange(e: any) {
    this.setData({ endTime: e.detail.value });
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
        const tempFilePath = res.tempFilePaths[0];
        wx.showLoading({ title: '上传中...' });
        wx.uploadFile({
          url: 'http://192.168.0.100:3000/api/upload', // 替换为你的后端地址
          filePath: tempFilePath,
          name: 'file',
          success: (uploadRes) => {
            wx.hideLoading();
            try {
              const data = JSON.parse(uploadRes.data);
              if (data.url) {
                // 拼接完整图片URL
                const fullUrl = 'http://192.168.0.100:3000' + data.url;
                this.setData({ cover: fullUrl });
              } else {
                wx.showToast({ title: '上传失败', icon: 'none' });
              }
            } catch (e) {
              wx.showToast({ title: '上传失败', icon: 'none' });
            }
          },
          fail: () => {
            wx.hideLoading();
            wx.showToast({ title: '上传失败', icon: 'none' });
          }
        });
      }
    });
  },
  onLoad(options: any) {
    if (options && options.id) {
      // 编辑模式，回显数据
      wx.showLoading({ title: '加载中...' });
      wx.request({
        url: `http://192.168.0.100:3000/api/venues/${options.id}`,
        method: 'GET',
        success: (res) => {
          wx.hideLoading();
          if (res.statusCode === 200 && res.data) {
            const data = res.data as any;
            let date = '', startTime = '', endTime = '';
            if (data.business_hours) {
              // 兼容格式：2024-07-10 18:00 ~ 20:00
              const match = data.business_hours.match(/(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})\s*~\s*(\d{2}:\d{2})/);
              if (match) {
                date = match[1]; startTime = match[2]; endTime = match[3];
              } else {
                date = data.business_hours.split(' ')[0];
              }
            }
            this.setData({
              name: data.name || '',
              categoryIndex: this.data.categories.indexOf(data.category),
              date,
              startTime,
              endTime,
              location: data.location || '',
              price: data.price ? String(data.price) : '',
              cover: data.cover || '',
              description: data.description || '',
              editId: data.id || null
            });
          }
        },
        fail: () => { wx.hideLoading(); }
      });
    }
  },
  async onSubmit() {
    const { name, categories, categoryIndex, date, startTime, endTime, location, price, cover, description, editId } = this.data;
    if (!name || !date || !startTime || !endTime || !location || !price) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' });
      return;
    }
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo || !userInfo.id) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    wx.showLoading({ title: editId ? '保存中...' : '发布中...' });
    const business_hours = `${date} ${startTime} ~ ${endTime}`;
    const reqData = {
      name,
      category: categories[categoryIndex],
      business_hours,
      location,
      price: parseFloat(price),
      rating: 0,
      cover,
      sports: [categories[categoryIndex]],
      description,
      creator_id: userInfo.id
    };
    if (editId) {
      wx.request({
        url: `http://192.168.0.100:3000/api/venues/${editId}`,
        method: 'PUT',
        data: reqData,
        success: (res) => {
          wx.hideLoading();
          if (res.statusCode === 200) {
            wx.showToast({ title: '保存成功' });
            wx.navigateBack();
          } else {
            wx.showToast({ title: '保存失败', icon: 'none' });
          }
        },
        fail: () => {
          wx.hideLoading();
          wx.showToast({ title: '网络错误', icon: 'none' });
        }
      });
    } else {
      wx.request({
        url: 'http://192.168.0.100:3000/api/venues',
        method: 'POST',
        data: reqData,
        success: (res) => {
          wx.hideLoading();
          if (res.statusCode === 200) {
            wx.showToast({ title: '发布成功' });
            // 清空表单内容
            this.setData({
              name: '',
              categoryIndex: 0,
              date: '',
              startTime: '',
              endTime: '',
              location: '',
              price: '',
              cover: '',
              description: '',
              editId: null
            });
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
    }
  },
});
