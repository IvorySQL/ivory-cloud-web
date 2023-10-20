import request from '@/utils/request'
// 登录
// export function login(data) {
//   return request({
//     url: '/login',
//     method: 'post',
//     data
//   })
// }

// 订阅
export function subscribe(data) {
  return request({
    url: '/huawei/createVM',
    method: 'post',
    data
  })
}

export function getInfo(token) {
  return request({
    url: '/vue-admin-template/user/info',
    method: 'get',
    params: { token }
  })
}

export function logout() {
  return request({
    url: '/vue-admin-template/user/logout',
    method: 'post'
  })
}
