import { constantRoutes } from '@/router'
import { asyncCloudRoutes } from '@/router/modules/asyncCloudRoutes'
import { asyncCloudRoutesAdmin } from '@/router/modules/asyncCloudRoutesAdmin'

/**
 * Use meta.role to determine if the current user has permission
 * @param roles
 * @param route
 */
function hasPermission(roles, route) {
  if (route.meta && route.meta.roles) {
    return roles.some(role => route.meta.roles.includes(role))
  } else {
    return true
  }
}

/**
 * Filter asynchronous routing tables by recursion
 * @param routes asyncRoutes
 * @param roles
 */
export function filterAsyncRoutes(routes, roles) {
  const res = []
  routes.forEach(route => {
    const tmp = { ...route }
    if (hasPermission(roles, tmp)) {
      if (tmp.children) {
        tmp.children = filterAsyncRoutes(tmp.children, roles)
      }
      res.push(tmp)
    }
  })

  return res
}

const state = {
  routes: [],
  addRoutes: []
}

const mutations = {
  SET_ROUTES: (state, routes) => {
    state.addRoutes = routes
    state.routes = constantRoutes.concat(routes)
  }
}

const actions = {
  generateRoutes({ commit }, roles) {
    return new Promise(resolve => {
      let accessedRoutes
      // 普通用户的话，可以看到所有的导航
      // admin 用户，只能看到裸金属服务器，备份服务器
      if (disableNative === false) {
        // 显示云原生数据库
        accessedRoutes = filterAsyncRoutes(asyncCloudRoutes, roles)
      }
      if (roles.includes('admin') && disableNative === false) {
        accessedRoutes = asyncCloudRoutesAdmin || []
      }
      // 对路由去重
      const uniqueRoutes = Array.from(new Set(accessedRoutes.map(route => route.path)))
        .map(path => accessedRoutes.find(route => route.path === path))
      commit('SET_ROUTES', uniqueRoutes)
      resolve(uniqueRoutes)
    })
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
