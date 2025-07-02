Page({
  data: {
    categories: ['足球', '篮球', '乒乓球', '羽毛球', '排球'],
    categoryIndex: 0,
  },
  onCategoryChange(e: any) {
    this.setData({ categoryIndex: e.detail.value });
  },
}); 