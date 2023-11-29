import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

/* Layout */
import Layout from '@/layout'
/**
 * constantRoutes
 * a base page that does not have permission requirements
 * all roles can be accessed
 */
export const constantRoutes = [
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
