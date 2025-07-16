// my.ts
// import { venues } from '../../utils/venues'; // 移除无效导入

Page({
  data: {
    // venues, // 移除无效数据
    favoriteVenues: [],
    bookings: [
      {
        id: 1,
        venueName: '羽毛球馆',
        date: '2024-05-20',
        time: '19:00-21:00'
      }
    ],
    userInfo: {
      avatar: '/images/default_avatar.png',
      nickname: '未登录',
      openid: '', // 新增，初始为空
      id: null as number | null // 新增，初始为null
    },
    isLogin: false,
    showMyActivitiesModal: false,
    myActivities: [] as any[],
    showMyFavoritesModal: false,
    myFavorites: [] as any[],
    showMyBookingsModal: false,
    myBookings: [] as any[],
    showSettingsPage: false, // 新增：设置页显示标志
    adminMode: false, // 是否为管理员模式
    adminToken: '', // 管理员token或凭证
    showAccountLoginModal: false,
    showRegisterModal: false,
    accountLoginUsername: '',
    accountLoginPassword: '',
    registerUsername: '',
    registerPassword: '',
    registerNickname: '',
    showBookingReviewModal: false,
    showUserManagementModal: false,
    allBookings: [] as any[],
    allUsers: [] as any[],
    showActivityBookingsModal: false,
    activityBookings: [] as any[],
    showVenueReviewModal: false,
    pendingVenues: [] as any[],
    showManageCommentsModal: false,
    manageCommentsList: [] as any[],
    showChangeAvatarModal: false,
    newAvatarUrl: '',
    showChangeNicknameModal: false,
    newNickname: '',
    showAdminVenueManageModal: false,
    adminAllVenues: [] as any[],
    showAdminLoginModal: false,
    adminLoginPassword: '',
  },
  onLoad() {
    // 从本地存储或后端获取收藏列表
    const favoriteVenues = wx.getStorageSync('favoriteVenues') || [];
    this.setData({
      favoriteVenues
    });
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        userInfo,
        isLogin: true
      });
    }
  },
  onShow() {
    // 每次页面显示都同步本地userInfo和收藏，保证登录和收藏状态
    const userInfo = wx.getStorageSync('userInfo');
    const favoriteVenues = wx.getStorageSync('favoriteVenues') || [];
    if (userInfo && userInfo.id) {
      this.setData({
        userInfo,
        isLogin: true,
        favoriteVenues
      });
    } else {
      this.setData({
        userInfo: {
          avatar: '/images/default_avatar.png',
          nickname: '未登录',
          openid: '',
          id: null
        },
        isLogin: false,
        favoriteVenues,
        showSettingsPage: false // 未登录时自动关闭设置页
      });
    }
  },
  removeFavorite(e: any) {
    const id = e.currentTarget.dataset.id;
    let favoriteVenues = this.data.favoriteVenues;
    favoriteVenues = favoriteVenues.filter((fid: number) => fid !== id);
    this.setData({
      favoriteVenues
    });
    wx.setStorageSync('favoriteVenues', favoriteVenues);
    wx.showToast({
      title: '已移除收藏',
      icon: 'none'
    });
  },
  //登录
  onLogin() {
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (userRes) => {
        wx.login({
          success: (res) => {
            if (res.code) {
              wx.request({
                url: 'http://192.168.43.222:3000/api/login',
                method: 'POST',
                data: {
                  code: res.code,
                  nickname: userRes.userInfo.nickName,
                  avatarUrl: userRes.userInfo.avatarUrl
                },
                success: (loginRes: any) => {
                  if (loginRes.statusCode === 200 && loginRes.data && loginRes.data.user) {
                    const user = loginRes.data.user;
                    this.setData({
                      userInfo: {
                        avatar: user.avatar_url,
                        nickname: user.nickname,
                        openid: user.openid,
                        id: user.id
                      },
                      isLogin: true
                    });
                    wx.setStorageSync('userInfo', {
                      avatar: user.avatar_url,
                      nickname: user.nickname,
                      openid: user.openid,
                      id: user.id
                    });
                    wx.showToast({ title: '登录成功' });
                    if (typeof this.onShow === 'function') this.onShow();
                  } else {
                    wx.showToast({ title: '登录失败', icon: 'none' });
                  }
                },
                fail: () => {
                  wx.showToast({ title: '网络错误', icon: 'none' });
                }
              });
            }
          }
        });
      },
      fail: (err) => {
        console.log('getUserProfile fail', err);
        wx.showToast({ title: '获取微信信息失败', icon: 'none' });
      }
    });
  },
  onGetUserInfo(e: any) {
    wx.showToast({ title: '请点击上方“登录”按钮', icon: 'none' });
  },
  openMyActivitiesModal() {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo || !userInfo.id) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    wx.request({
      url: `http://192.168.43.222:3000/api/my_venues/${userInfo.id}`,
      method: 'GET',
      success: (res) => {
        this.setData({
          myActivities: Array.isArray(res.data) ? res.data : [],
          showMyActivitiesModal: true
        });
      }
    });
  },
  closeMyActivitiesModal() {
    this.setData({ showMyActivitiesModal: false });
  },
  goToEditFromModal(e: any) {
    const id = e.currentTarget.dataset.id;
    // 查找该活动，若已结束则不允许编辑
    const activity = this.data.myActivities.find((a: any) => a.id === id);
    if (activity && activity.status === 'ended') {
      wx.showToast({ title: '已结束的活动不可编辑', icon: 'none' });
      return;
    }
    this.setData({ showMyActivitiesModal: false });
    wx.setStorageSync('showEditVenueId', id);
    wx.switchTab({ url: '/pages/index/index' });
  },
  deleteActivityFromModal(e: any) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除该活动吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' });
          wx.request({
            url: `http://192.168.43.222:3000/api/venues/${id}`,
            method: 'DELETE',
            success: (delRes) => {
              wx.hideLoading();
              if (delRes.statusCode === 200) {
                wx.showToast({ title: '删除成功' });
                // 重新拉取
                this.openMyActivitiesModal();
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
  endActivityFromModal(e: any) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认结束',
      content: '确定要结束该活动吗？结束后将不再对外展示，但你仍可在“我的发布”中查看。',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '结束中...' });
          wx.request({
            url: `http://192.168.43.222:3000/api/venues/${id}`,
            method: 'PUT',
            data: { status: 'ended' },
            header: { 'Content-Type': 'application/json' },
            success: (resp) => {
              wx.hideLoading();
              if (resp.statusCode === 200) {
                wx.showToast({ title: '已结束' });
                this.openMyActivitiesModal(); // 重新拉取
              } else {
                wx.showToast({ title: '操作失败', icon: 'none' });
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
  openMyFavoritesModal() {
    const userInfo = wx.getStorageSync('userInfo');
    const favoriteVenues = wx.getStorageSync('favoriteVenues') || [];
    if (!userInfo || !userInfo.id) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    wx.request({
      url: `http://192.168.43.222:3000/api/favorites/${userInfo.id}`,
      method: 'GET',
      success: (res) => {
        this.setData({
          myFavorites: Array.isArray(res.data) ? res.data : [],
          showMyFavoritesModal: true,
          favoriteVenues // 保证同步
        });
      }
    });
  },
  closeMyFavoritesModal() {
    this.setData({ showMyFavoritesModal: false });
  },
  removeFavoriteFromModal(e: any) {
    const id = e.currentTarget.dataset.id;
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo || !userInfo.id) return;
    wx.request({
      url: `http://192.168.43.222:3000/api/favorites`,
      method: 'POST',
      data: { userId: userInfo.id, venueId: id },
      header: { 'Content-Type': 'application/json' },
      success: (res) => {
        let data = res.data;
        if (typeof data === 'string') {
          try { data = JSON.parse(data); } catch (e) { data = {}; }
        }
        if (res.statusCode === 200 && typeof data === 'object' && data !== null && 'isFavorite' in data && data.isFavorite === false) {
          wx.showToast({ title: '已取消收藏', icon: 'none' });
          // 刷新本地缓存
          let favoriteVenues = wx.getStorageSync('favoriteVenues') || [];
          favoriteVenues = favoriteVenues.filter((fid: number) => fid !== id);
          wx.setStorageSync('favoriteVenues', favoriteVenues);
          this.setData({ favoriteVenues });
          this.openMyFavoritesModal();
        }
      }
    });
  },
  openMyBookingsModal() {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo || !userInfo.id) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    this.setData({ showMyBookingsModal: true });
    wx.request({
      url: `http://192.168.43.222:3000/api/bookings/${userInfo.id}`,
      method: 'GET',
      success: (res) => {
        this.setData({ myBookings: Array.isArray(res.data) ? res.data : [] });
      }
    });
  },
  closeMyBookingsModal() {
    this.setData({ showMyBookingsModal: false });
  },
  cancelBookingFromModal(e: any) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认取消',
      content: '确定要取消该报名吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '取消中...' });
          wx.request({
            url: `http://192.168.43.222:3000/api/bookings/${id}`,
            method: 'PUT',
            data: { status: 'cancelled' },
            header: { 'Content-Type': 'application/json' },
            success: (resp) => {
              wx.hideLoading();
              if (resp.statusCode === 200) {
                wx.showToast({ title: '已取消' });
                this.openMyBookingsModal(); // 重新拉取
              } else {
                wx.showToast({ title: '取消失败', icon: 'none' });
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
  goToVenueDetailFromModal(e: any) {
    const id = e.currentTarget.dataset.id;
    wx.setStorageSync('showVenueDetailId', id);
    wx.switchTab({ url: '/pages/index/index' });
  },
  // 设置页相关
  openSettingsPage() {
    this.setData({ showSettingsPage: true });
  },
  closeSettingsPage() {
    this.setData({ showSettingsPage: false });
  },
  // 退出登录
  logout() {
    wx.removeStorageSync('userInfo');
    wx.removeStorageSync('favoriteVenues');
    wx.removeStorageSync('adminMode');
    this.setData({
      userInfo: {
        avatar: '/images/default_avatar.png',
        nickname: '未登录',
        openid: '',
        id: null
      },
      isLogin: false,
      favoriteVenues: [],
      showSettingsPage: false,
      adminMode: false
    });
    wx.showToast({ title: '已退出登录', icon: 'none' });
  },
  // 以管理员身份登录
  loginAsAdmin() {
    this.openAdminLoginModal();
  },
  // 退出管理员模式
  logoutAdmin() {
    wx.removeStorageSync('adminMode');
    this.setData({ adminMode: false });
    wx.showToast({ title: '已退出管理员模式', icon: 'none' });
  },
  // 账号密码登录弹窗
  openAccountLogin() {
    this.setData({
      showAccountLoginModal: true,
      accountLoginUsername: '',
      accountLoginPassword: ''
    });
  },
  closeAccountLoginModal() {
    this.setData({ showAccountLoginModal: false });
  },
  submitAccountLogin() {
    const username = this.data.accountLoginUsername.trim();
    const password = this.data.accountLoginPassword.trim();
    if (!username || !password) {
      wx.showToast({ title: '请输入账号和密码', icon: 'none' });
      return;
    }
    wx.request({
      url: 'http://192.168.43.222:3000/api/account_login',
      method: 'POST',
      data: { username, password },
      header: { 'Content-Type': 'application/json' },
      success: (loginRes: any) => {
        if (loginRes.statusCode === 200 && loginRes.data && loginRes.data.user) {
          const user = loginRes.data.user;
          this.setData({
            userInfo: {
              avatar: user.avatar_url || '/images/default_avatar.png',
              nickname: user.nickname || user.username,
              openid: user.openid || '',
              id: user.id
            },
            isLogin: true,
            showAccountLoginModal: false
          });
          wx.setStorageSync('userInfo', {
            avatar: user.avatar_url || '/images/default_avatar.png',
            nickname: user.nickname || user.username,
            openid: user.openid || '',
            id: user.id
          });
          wx.showToast({ title: '登录成功' });
          if (typeof this.onShow === 'function') this.onShow();
        } else {
          wx.showToast({ title: '账号或密码错误', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  },
  openRegisterFromLogin() {
    this.setData({
      showAccountLoginModal: false,
      showRegisterModal: true,
      registerUsername: '',
      registerPassword: '',
      registerNickname: ''
    });
  },
  closeRegisterModal() {
    this.setData({ showRegisterModal: false });
  },
  submitRegister() {
    const username = this.data.registerUsername.trim();
    const password = this.data.registerPassword.trim();
    const nickname = this.data.registerNickname.trim();
    if (!username || !password) {
      wx.showToast({ title: '请输入账号和密码', icon: 'none' });
      return;
    }
    wx.request({
      url: 'http://192.168.43.222:3000/api/register',
      method: 'POST',
      data: { username, password, nickname },
      header: { 'Content-Type': 'application/json' },
      success: (regRes: any) => {
        if (regRes.statusCode === 200 && regRes.data && regRes.data.user) {
          wx.showToast({ title: '注册成功，请登录', icon: 'success' });
          this.setData({ showRegisterModal: false });
          setTimeout(() => {
            this.setData({ showAccountLoginModal: true });
          }, 500);
        } else if (regRes.statusCode === 409) {
          wx.showToast({ title: '用户名已存在', icon: 'none' });
        } else {
          wx.showToast({ title: '注册失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  },
  backToLoginFromRegister() {
    this.setData({ showRegisterModal: false, showAccountLoginModal: true });
  },
  onAccountLoginUsernameInput(e: any) {
    this.setData({ accountLoginUsername: e.detail.value });
  },
  onAccountLoginPasswordInput(e: any) {
    this.setData({ accountLoginPassword: e.detail.value });
  },
  onRegisterUsernameInput(e: any) {
    this.setData({ registerUsername: e.detail.value });
  },
  onRegisterPasswordInput(e: any) {
    this.setData({ registerPassword: e.detail.value });
  },
  onRegisterNicknameInput(e: any) {
    this.setData({ registerNickname: e.detail.value });
  },
  openBookingReview() {
    this.setData({ showBookingReviewModal: true });
    wx.request({
      url: 'http://192.168.43.222:3000/api/all_bookings',
      method: 'GET',
      success: (res) => {
        this.setData({ allBookings: Array.isArray(res.data) ? res.data : [] });
      }
    });
  },
  closeBookingReview() {
    this.setData({ showBookingReviewModal: false });
  },
  approveBooking(e: any) {
    const id = e.currentTarget.dataset.id;
    wx.request({
      url: `http://192.168.43.222:3000/api/bookings/${id}`,
      method: 'PUT',
      data: { status: 'confirmed' },
      header: { 'Content-Type': 'application/json' },
      success: () => this.openBookingReview()
    });
  },
  rejectBooking(e: any) {
    const id = e.currentTarget.dataset.id;
    wx.request({
      url: `http://192.168.43.222:3000/api/bookings/${id}`,
      method: 'PUT',
      data: { status: 'cancelled' },
      header: { 'Content-Type': 'application/json' },
      success: () => this.openBookingReview()
    });
  },
  openUserManagement() {
    this.setData({ showUserManagementModal: true });
    wx.request({
      url: 'http://192.168.43.222:3000/api/all_users',
      method: 'GET',
      success: (res) => {
        this.setData({ allUsers: Array.isArray(res.data) ? res.data : [] });
      }
    });
  },
  closeUserManagement() {
    this.setData({ showUserManagementModal: false });
  },
  disableUser(e: any) {
    const id = e.currentTarget.dataset.id;
    wx.request({
      url: `http://192.168.43.222:3000/api/users/${id}`,
      method: 'PUT',
      data: { disabled: true },
      header: { 'Content-Type': 'application/json' },
      success: () => this.openUserManagement()
    });
  },
  enableUser(e: any) {
    const id = e.currentTarget.dataset.id;
    wx.request({
      url: `http://192.168.43.222:3000/api/users/${id}`,
      method: 'PUT',
      data: { disabled: false },
      header: { 'Content-Type': 'application/json' },
      success: () => this.openUserManagement()
    });
  },
  deleteUser(e: any) {
    const id = e.currentTarget.dataset.id;
    wx.request({
      url: `http://192.168.43.222:3000/api/users/${id}`,
      method: 'DELETE',
      success: () => this.openUserManagement()
    });
  },
  // 我的发布-查看报名
  openActivityBookings(e: any) {
    const activityId = e.currentTarget.dataset.id;
    this.setData({ showActivityBookingsModal: true });
    wx.request({
      url: `http://192.168.43.222:3000/api/activity_bookings/${activityId}`,
      method: 'GET',
      success: (res) => {
        this.setData({ activityBookings: Array.isArray(res.data) ? res.data : [] });
      }
    });
  },
  closeActivityBookings() {
    this.setData({ showActivityBookingsModal: false });
  },
  approveActivityBooking(e: any) {
    const id = e.currentTarget.dataset.id;
    wx.request({
      url: `http://192.168.43.222:3000/api/bookings/${id}`,
      method: 'PUT',
      data: { status: 'confirmed' },
      header: { 'Content-Type': 'application/json' },
      success: () => {
        // 刷新报名列表
        const activityId = this.data.activityBookings[0]?.venue_id;
        if (activityId) this.openActivityBookings({ currentTarget: { dataset: { id: activityId } } });
      }
    });
  },
  rejectActivityBooking(e: any) {
    const id = e.currentTarget.dataset.id;
    wx.request({
      url: `http://192.168.43.222:3000/api/bookings/${id}`,
      method: 'PUT',
      data: { status: 'cancelled' },
      header: { 'Content-Type': 'application/json' },
      success: () => {
        const activityId = this.data.activityBookings[0]?.venue_id;
        if (activityId) this.openActivityBookings({ currentTarget: { dataset: { id: activityId } } });
      }
    });
  },
  // 管理员-活动审核
  openVenueReview() {
    this.setData({ showVenueReviewModal: true });
    wx.request({
      url: 'http://192.168.43.222:3000/api/pending_venues',
      method: 'GET',
      success: (res) => {
        this.setData({ pendingVenues: Array.isArray(res.data) ? res.data : [] });
      }
    });
  },
  closeVenueReview() {
    this.setData({ showVenueReviewModal: false });
  },
  approveVenue(e: any) {
    const id = e.currentTarget.dataset.id;
    wx.request({
      url: `http://192.168.43.222:3000/api/venues/${id}`,
      method: 'PUT',
      data: { status: 'approved' },
      header: { 'Content-Type': 'application/json' },
      success: () => this.openVenueReview()
    });
  },
  rejectVenue(e: any) {
    const id = e.currentTarget.dataset.id;
    wx.request({
      url: `http://192.168.43.222:3000/api/venues/${id}`,
      method: 'PUT',
      data: { status: 'rejected' },
      header: { 'Content-Type': 'application/json' },
      success: () => this.openVenueReview()
    });
  },
  openManageComments(e: any) {
    const activityId = e.currentTarget.dataset.id;
    this.setData({ showManageCommentsModal: true, manageCommentsList: [] });
    wx.request({
      url: `http://192.168.43.222:3000/api/comments/${activityId}`,
      method: 'GET',
      success: (res) => {
        // 拉平成一维评论列表
        const flatten = (list: any[]): any[] => {
          let arr: any[] = [];
          list.forEach(c => {
            arr.push(c);
            if (c.replies && c.replies.length) arr = arr.concat(flatten(c.replies));
          });
          return arr;
        };
        const commentList = Array.isArray(res.data) ? res.data : [];
        this.setData({ manageCommentsList: flatten(commentList) });
      }
    });
  },
  closeManageComments() {
    this.setData({ showManageCommentsModal: false });
  },
  deleteCommentFromManage(e: any) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除该评论吗？',
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: `http://192.168.43.222:3000/api/comments/${id}`,
            method: 'DELETE',
            success: () => {
              wx.showToast({ title: '删除成功' });
              // 重新拉取
              const activityId = this.data.manageCommentsList[0]?.venue_id;
              if (activityId) this.openManageComments({ currentTarget: { dataset: { id: activityId } } });
            }
          });
        }
      }
    });
  },
  // 更换头像相关
  openChangeAvatar() {
    this.setData({ showChangeAvatarModal: true, newAvatarUrl: '' });
  },
  closeChangeAvatar() {
    this.setData({ showChangeAvatarModal: false, newAvatarUrl: '' });
  },
  chooseAvatar() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        if (res.tempFilePaths && res.tempFilePaths.length > 0) {
          this.setData({ newAvatarUrl: res.tempFilePaths[0] });
        }
      }
    });
  },
  uploadAvatar() {
    const { newAvatarUrl, userInfo } = this.data;
    if (!newAvatarUrl) {
      wx.showToast({ title: '请先选择图片', icon: 'none' });
      return;
    }
    wx.uploadFile({
      url: 'http://192.168.43.222:3000/api/upload',
      filePath: newAvatarUrl,
      name: 'file',
      success: (res) => {
        let data: any = res.data;
        if (typeof data === 'string') {
          try { data = JSON.parse(data); } catch (e) { data = {}; }
        }
        if (data && typeof data === 'object' && data.url) {
          this.updateUserAvatar(data.url);
        } else {
          wx.showToast({ title: '上传失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '上传失败', icon: 'none' });
      }
    });
  },
  updateUserAvatar(url: string) {
    const { userInfo } = this.data;
    if (!userInfo || !userInfo.id) return;
    // 拼接完整头像地址
    const fullUrl = url.startsWith('http') ? url : `http://192.168.43.222:3000${url}`;
    wx.request({
      url: `http://192.168.43.222:3000/api/users/${userInfo.id}`,
      method: 'PUT',
      data: { avatar_url: fullUrl },
      header: { 'Content-Type': 'application/json' },
      success: (res) => {
        if (res.statusCode === 200) {
          wx.showToast({ title: '头像已更新' });
          // 更新本地 userInfo
          const newUserInfo = { ...userInfo, avatar: fullUrl, avatar_url: fullUrl };
          this.setData({ userInfo: newUserInfo, showChangeAvatarModal: false, newAvatarUrl: '' });
          wx.setStorageSync('userInfo', newUserInfo);
          if (typeof this.onShow === 'function') this.onShow();
          // 通知首页刷新评论区头像
          wx.setStorageSync('refreshIndexComments', true);
        } else {
          wx.showToast({ title: '更新失败', icon: 'none' });
        }
      }
    });
  },
  // 更换昵称相关
  openChangeNickname() {
    this.setData({ showChangeNicknameModal: true, newNickname: this.data.userInfo.nickname || '' });
  },
  closeChangeNickname() {
    this.setData({ showChangeNicknameModal: false, newNickname: '' });
  },
  onChangeNicknameInput(e: any) {
    this.setData({ newNickname: e.detail.value });
  },
  submitChangeNickname() {
    const { newNickname, userInfo } = this.data;
    if (!newNickname.trim()) {
      wx.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }
    wx.request({
      url: `http://192.168.43.222:3000/api/users/${userInfo.id}`,
      method: 'PUT',
      data: { nickname: newNickname.trim() },
      header: { 'Content-Type': 'application/json' },
      success: (res) => {
        if (res.statusCode === 200) {
          wx.showToast({ title: '昵称已更新' });
          const newUserInfo = { ...userInfo, nickname: newNickname.trim() };
          this.setData({ userInfo: newUserInfo, showChangeNicknameModal: false, newNickname: '' });
          wx.setStorageSync('userInfo', newUserInfo);
          if (typeof this.onShow === 'function') this.onShow();
          // 通知首页刷新评论区昵称
          wx.setStorageSync('refreshIndexComments', true);
        } else {
          wx.showToast({ title: '更新失败', icon: 'none' });
        }
      }
    });
  },
  openAdminVenueManage() {
    this.setData({ showAdminVenueManageModal: true });
    wx.request({
      url: 'http://192.168.43.222:3000/api/all_venues',
      method: 'GET',
      success: (res) => {
        this.setData({ adminAllVenues: Array.isArray(res.data) ? res.data : [] });
      }
    });
  },
  closeAdminVenueManage() {
    this.setData({ showAdminVenueManageModal: false });
  },
  adminEndVenue(e: any) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认结束',
      content: '确定要结束该活动吗？',
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: `http://192.168.43.222:3000/api/venues/${id}`,
            method: 'PUT',
            data: { status: 'ended' },
            header: { 'Content-Type': 'application/json' },
            success: () => this.openAdminVenueManage()
          });
        }
      }
    });
  },
  adminDeleteVenue(e: any) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除该活动吗？',
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: `http://192.168.43.222:3000/api/venues/${id}`,
            method: 'DELETE',
            success: () => this.openAdminVenueManage()
          });
        }
      }
    });
  },
  // 管理员登录弹窗
  openAdminLoginModal() {
    this.setData({ showAdminLoginModal: true, adminLoginPassword: '' });
  },
  closeAdminLoginModal() {
    this.setData({ showAdminLoginModal: false, adminLoginPassword: '' });
  },
  onAdminLoginPasswordInput(e: any) {
    this.setData({ adminLoginPassword: e.detail.value });
  },
  submitAdminLoginModal() {
    const pwd = this.data.adminLoginPassword;
    if (!pwd) {
      wx.showToast({ title: '请输入管理员密码', icon: 'none' });
      return;
    }
    if (pwd === 'admin123') {
      this.setData({ adminMode: true, adminToken: 'admin-token', showAdminLoginModal: false });
      wx.setStorageSync('adminMode', true);
      wx.showToast({ title: '管理员登录成功', icon: 'success' });
    } else {
      wx.showToast({ title: '密码错误', icon: 'none' });
    }
  },
});