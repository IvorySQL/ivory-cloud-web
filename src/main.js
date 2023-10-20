import Vue from 'vue'
import axios from 'axios'
import VueAxios from 'vue-axios'
import VueCookies from 'vue-cookies'
import 'normalize.css/normalize.css' // A modern alternative to CSS resets
import TreeTable from '@weilan/el-tree-table'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import locale from 'element-ui/lib/locale/lang/en' // lang i18n
import '@/styles/index.scss' // global css
import App from './App'
import store from './store'
import router from './router'
// import $ from 'jquery'
import '@/icons' // icon
import '@/permission' // permission control
import VueQuillEditor from 'vue-quill-editor'
import 'quill/dist/quill.core.css'
import 'quill/dist/quill.snow.css'
import 'quill/dist/quill.bubble.css'
import md5 from 'js-md5'
Vue.use(VueQuillEditor)
/**
 * If you don't want to use mock-server
 * you want to use MockJs for mock api
 * you can execute: mockXHR()
 *
 * Currently MockJs will be used in the production environment,
 * please remove it before going online ! ! !
 */
if (process.env.NODE_ENV === 'production') {
  const { mockXHR } = require('../mock')
  mockXHR()
}
// 引入echarts
import echarts from 'echarts'

Vue.use(echarts)
Vue.prototype.$echarts = echarts
// set ElementUI lang to EN
Vue.use(ElementUI, { locale })
Vue.use(VueAxios, axios)
Vue.use(VueCookies)
Vue.use(TreeTable)
// Vue.use($)
// 如果想要中文版 element-ui，按如下方式声明
// Vue.use(ElementUI)
// Vue.prototype.$http = axios;
// Vue.prototype.$http.defaults.baseURL = 'http://localhost:8080/cloudapi/api/';
// Vue.prototype.$http.defaults.baseURL = 'http://127.0.0.1:8090/cloudapi/api/';
Vue.prototype.$http.defaults.baseURL = window.PLATFROM_CONFIG.baseUrl
Vue.config.productionTip = false
Vue.prototype.$md5 = md5

new Vue({
  el: '#app',
  router,
  store,
  render: h => h(App)
})

// axiso增加全局配置 ，发送请求时携带cookie
// axios.defaults.withCredentials = true;

axios.defaults.timeout = 20000
// 返回其他状态吗
axios.defaults.validateStatus = function(status) {
  return status >= 200 && status <= 500 // 默认的
}
axios.interceptors.request.use(config => {
  const auth_token = localStorage.XAUTHTOKEN

  // console.log("auth_token in interceptor:   " + auth_token)
  if (auth_token) { // 判断是否存在token，如果存在的话，则每个http header都加上token
    // config.headers.Authorization = 'bearer  '+token;
    // 拦截，给所有的HTTP请求加消息头
    // 前端添加的消息头需要在后端配置，允许携带那些header，否则会有cors错误
    config.headers.common = {
      'Authorization': auth_token === undefined ? '' : 'bearer ' + auth_token
    }
  }
  return config
}, error => {
  return Promise.reject(error)
})

// 响应拦截器
axios.interceptors.response.use(response => {
  // 对响应数据做些什么
  const res = response.data
  // 401: Illegal token; 403: Token expired;
  if (res.code === 401 || res.code === 403) {
    // to re-login
    // 清除login的信息，并且重置路由
    store.dispatch('user/logout')
    router.push({ path: '/login' })
  }
  // if the custom code is not 200, it is judged as an error.
  // if (res.code && res.code !== 200 && res.code !== '200') {
  //   const message = res.message || 'Error' ||res.msg
  //   return Promise.reject(message)
  // }
  return response
}, error => {
  const unAuth = '401'
  const forbidden = '403'
  const errorString = error.toString()
  const isUnAuth = errorString.includes(unAuth)
  const isForbidden = errorString.includes(forbidden)
  if (isUnAuth || isForbidden) {
    // 没有登录的请求, 都跳转至登录界面

    // 清除login的信息，并且重置路由
    store.dispatch('user/logout')
    router.push({ path: '/login' })
  }

  return Promise.reject(error)
})
