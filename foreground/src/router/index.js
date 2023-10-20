import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

/* Layout */
import Layout from '@/layout'
/**
 * Note: sub-menu only appear when route children.length >= 1
 * Detail see: https://panjiachen.github.io/vue-element-admin-site/guide/essentials/router-and-nav.html
 *
 * hidden: true                   if set true, item will not show in the sidebar(default is false)
 * alwaysShow: true               if set true, will always show the root menu
 *                                if not set alwaysShow, when item has more than one children route,
 *                                it will becomes nested mode, otherwise not show the root menu
 * redirect: noRedirect           if set noRedirect will no redirect in the breadcrumb
 * name:'router-name'             the name is used by <keep-alive> (must set!!!)
 * meta : {
    roles: ['admin','editor']    control the page roles (you can set multiple roles)
    title: 'title'               the name show in sidebar and breadcrumb (recommend set)
    icon: 'svg-name'/'el-icon-x' the icon show in the sidebar
    breadcrumb: false            if set false, the item will hidden in breadcrumb(default is true)
    activeMenu: '/example/list'  if set path, the sidebar will highlight the path you set
  }
 */

/**
 * constantRoutes
 * a base page that does not have permission requirements
 * all roles can be accessed
 */
export const constantRoutes = [
  {
    path: '/login',
    component: () => import('@/views/Common/login/index'),
    hidden: true
  },
  {
    path: '/UserLogin',
    component: () => import('@/views/Common/UserLogin/index'),
    hidden: true
  },
  {
    path: '/register',
    component: () => import('@/views/Common/register/index'),
    hidden: true
  },
  {
    path: '/modifyPassword',
    component: () => import('@/views/Common/modifyPassword/index'),
    hidden: true
  },
  {
    path: '/404',
    component: () => import('@/views/404'),
    hidden: true
  },
  // {
  //   path: '/',
  //   component: Layout,
  //   redirect: '/DBInstance/index',
  //   children: [{
  //     path: 'DBInstance/index',
  //     name: 'DBInstance',
  //     component: () => import('@/views/DBInstance/index'),
  //     meta: {title: '数据库订阅', icon: 'Dashboard', roles: 'routine'}
  //   }]
  // },

  {
    path: '/Usage',
    hidden: true,
    component: Layout,
    children: [
      {
        path: 'index',
        name: 'Usage',
        component: () => import('@/views/Common/Usage/index'),
        meta: { title: '使用手册', icon: 'form' }
      }
    ]
  },
  {
    path: '/FeedBack',
    hidden: true,
    component: Layout,
    children: [
      {
        path: 'index',
        name: 'FeedBack',
        component: () => import('@/views/Common/FeedBack/index'),
        meta: { title: '意见反馈', icon: 'form' }
      }
    ]
  },
  {
    path: '/OwnerCenter',
    hidden: true,
    component: Layout,
    children: [
      {
        path: 'index',
        name: 'OnerCenter',
        component: () => import('@/views/Common/OwnerCenter/index'),
        meta: { title: '个人中心', icon: 'form' }
      }
    ]
  }

//  {path: '*', redirect: '/404', hidden: true}
]
const createRouter = () => new Router({
  scrollBehavior: () => ({ y: 0 }),
  routes: constantRoutes
})

const router = createRouter()

// Detail see: https://github.com/vuejs/vue-router/issues/1234#issuecomment-357941465
// 切换用户，重置路由
export function resetRouter() {
  const newRouter = createRouter()
  router.matcher = newRouter.matcher // reset router
}

export default router
