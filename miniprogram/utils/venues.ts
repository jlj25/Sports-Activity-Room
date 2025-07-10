// miniprogram/utils/venues.ts

const BASE_URL = 'http://172.16.17.253:3000/api'; // 根据实际后端地址调整

// 新增活动
export async function createVenue(data: any) {
  return wx.request({
    url: `${BASE_URL}/venues`,
    method: 'POST',
    data,
  });
}

// 编辑活动
export async function updateVenue(id: number, data: any) {
  return wx.request({
    url: `${BASE_URL}/venues/${id}`,
    method: 'PUT',
    data,
  });
}

// 删除活动
export async function deleteVenue(id: number) {
  return wx.request({
    url: `${BASE_URL}/venues/${id}`,
    method: 'DELETE',
  });
}