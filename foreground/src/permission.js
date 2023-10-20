import router from './router'
// import { asyncRoutes } from './router'
import store from './store'
// import { Message } from 'element-ui'
import NProgress from 'nprogress' // progress bar
import 'nprogress/nprogress.css' // progress bar style
// import { getToken } from '@/utils/auth' // get token from cookie
import getPageTitle from '@/utils/get-page-title'
// import { validUsername } from './utils/validate'

NProgress.configure({ showSpinner: false }) // NProgress Configuration
// 白名单
const whiteList = ['/login', '/UserLogin', '/register', '/modifyPassword'] // no redirect whitelist

router.beforeEach(async(to, from, next) => {
  // start progress bar
  NProgress.start()

  // set page title
  document.title = getPageTitle(to.meta.title)

  // determine whether the user has logged in
  // const hasToken = getToken();
  // just for test
  // localStorage.removeItem('XAUTHTOKEN')
  const hasToken = localStorage.XAUTHTOKEN

  var userId = localStorage.getItem('userId')
  if (hasToken) {
    console.log('has token')
    if (to.path === '/login') {
      // if is logged in, redirect to the home page
      next({ path: '/' })
      NProgress.done()
    } else {
      // determine whether the user has obtained his permission roles through getInfocon

      const hasRoles = store.getters.roles && store.getters.roles.length > 0
      if (hasRoles) {
        // 当有用户权限的时候，说明所有可访问路由已生成 如访问没权限的全面会自动进入404页面
        console.log('already has roles: ', store.getters.roles)
        console.log('already has roles to.path is:', to.path)
        next()
      } else {
        try {
          console.log('have no roles, add to routes')
          // get user info
          // note: roles must be a object array! such as: ['admin'] or ,['developer','editor']

          // const roles  = ['admin'];

          const roles = JSON.parse(localStorage.getItem('roles'))
          // 存储role,以便后续不需要再获取role
          await store.dispatch('user/setRoles', roles)
          // 存储用户名
          const userName = localStorage.getItem('userName')
          store.dispatch('user/setUserName', userName)
          console.log('------to.path is:', to.path)
          // //后端重启，但是前端没有logout. 模拟logout退出
          if (to.path === '/') {
            //   console.log("------dashboardUrl line 66 is:")
          //  next('/login')
            const accessRoutes = await store.dispatch('permission/generateRoutes', roles)
            // dynamically add accessible routes
            router.addRoutes(accessRoutes)
            var dashboardUrl = '/Dashboard/index?userId=' + userId

            next(dashboardUrl)
          } else {
            const accessRoutes = await store.dispatch('permission/generateRoutes', roles)
            // dynamically add accessible routes
            router.addRoutes(accessRoutes)

            // hack method to ensure that addRoutes is complete
            // set the replace: true, so the navigation will not leave a history record
            next({ ...to, replace: true })
          }
        // next()
        } catch (error) {
          // remove token and go to login page to re-login
          await store.dispatch('user/resetToken')
          console.error('================', error)
          // Message.error(error || 'Has Error')
          next(`/login?redirect=${to.path}`)
          NProgress.done()
        }
      }
    }
  } else {
    /* has no token*/
    console.error('has no token, to.path: ', to.path)
    if (whiteList.indexOf(to.path) !== -1) {
      // in the free login whitelist, go directly
      next()
    } else {
      // other pages that do not have permission to access are redirected to the login page.
      // if (to.path === '404') {
      //   next()
      // } else {
      // other pages that do not have permission to access are redirected to the login page.
      // fix bug: 用户手动清除 localStorage.XAUTHTOKEN
      // 清除login的信息，并且重置路由
      store.dispatch('user/logout')
      next(`/login?redirect=${to.path}`)
      NProgress.done()
      //  if (!userId) {
      //    next('/login')
      //  }
      // }
      // next()
    }
  }
})

router.afterEach(() => {
  // finish progress bar
  NProgress.done()
})
