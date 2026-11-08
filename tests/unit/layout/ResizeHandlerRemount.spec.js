import Vue from 'vue'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import { mount, createLocalVue } from '@vue/test-utils'
import ResizeHandler from '@/layout/mixin/ResizeHandler'
import store from '@/store'

// Resolve the production mixin's singleton import to actual Vuex + the complete
// production app module. No action/mutation/method/hook replacement.
jest.mock('@/store', () => {
  const ActualVue = require('vue')
  const ActualVuex = require('vuex')
  ActualVue.use(ActualVuex)
  const app = require('@/store/modules/app').default
  return new ActualVuex.Store({ modules: { app }})
})

const localVue = createLocalVue()
localVue.use(Vuex)
localVue.use(VueRouter)

const LayoutProbe = {
  name: 'LayoutDeviceProbe',
  mixins: [ResizeHandler],
  computed: {
    device() { return this.$store.state.app.device },
    sidebar() { return this.$store.state.app.sidebar }
  },
  render(h) {
    return h('div', { class: { 'layout-probe': true, mobile: this.device === 'mobile' }}, this.device)
  }
}
const LoginProbe = { render: h => h('div', { class: 'login-probe' }, 'login') }

describe('ResizeHandler routed mount lifecycle with real app module', () => {
  let width
  let geometry
  let visibility
  let router
  let wrapper
  let host

  async function settle() {
    await Vue.nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
    await Vue.nextTick()
  }

  async function navigate(path) {
    await router.push(path)
    await settle()
  }

  async function start(path) {
    router = new VueRouter({
      mode: 'abstract',
      routes: [
        { path: '/login', component: LoginProbe },
        { path: '/layout', component: LayoutProbe }
      ]
    })
    await router.push(path)
    host = document.createElement('div')
    document.body.appendChild(host)
    wrapper = mount({ render: h => h('router-view') }, {
      localVue, router, store, attachTo: host
    })
    await settle()
  }

  beforeEach(async() => {
    width = 1280
    geometry = jest.spyOn(document.body, 'getBoundingClientRect')
      .mockImplementation(() => ({
        width, height: 800, top: 0, left: 0, right: width, bottom: 800,
        x: 0, y: 0, toJSON() { return {} }
      }))
    visibility = jest.spyOn(document, 'hidden', 'get').mockReturnValue(false)
    await store.dispatch('app/toggleDevice', 'desktop')
    await store.dispatch('app/closeSideBar', { withoutAnimation: true })
    await store.dispatch('app/toggleSideBar')
  })

  afterEach(async() => {
    const currentWrapper = wrapper
    const currentHost = host
    wrapper = null
    host = null
    if (currentWrapper) currentWrapper.destroy()
    await settle()
    if (currentHost && currentHost.parentNode) currentHost.parentNode.removeChild(currentHost)
    geometry.mockRestore()
    visibility.mockRestore()
  })

  test('mobile -> independent login -> desktop remount resynchronizes device', async() => {
    width = 480
    await start('/layout')
    expect(store.state.app.device).toBe('mobile')
    await navigate('/login')
    expect(wrapper.find('.layout-probe').exists()).toBe(false)
    width = 1280
    window.dispatchEvent(new Event('resize'))
    await settle()
    // No Layout listener is alive on the independent login page.
    expect(store.state.app.device).toBe('mobile')
    await navigate('/layout')
    expect(store.state.app.device).toBe('desktop')
    expect(wrapper.find('.layout-probe').classes()).not.toContain('mobile')
    expect(store.state.app.sidebar.opened).toBe(false)
  })

  test('first desktop mount preserves an opened sidebar', async() => {
    await start('/layout')
    expect(store.state.app.device).toBe('desktop')
    expect(store.state.app.sidebar.opened).toBe(true)
    expect(wrapper.find('.layout-probe').classes()).not.toContain('mobile')
  })

  test('first mobile mount closes sidebar without animation', async() => {
    width = 480
    await start('/layout')
    expect(store.state.app.device).toBe('mobile')
    expect(store.state.app.sidebar.opened).toBe(false)
    expect(store.state.app.sidebar.withoutAnimation).toBe(true)
  })

  test('live resize still updates device without reopening sidebar', async() => {
    await start('/layout')
    width = 480
    window.dispatchEvent(new Event('resize'))
    await settle()
    expect(store.state.app.device).toBe('mobile')
    expect(store.state.app.sidebar.opened).toBe(false)
    width = 1280
    window.dispatchEvent(new Event('resize'))
    await settle()
    expect(store.state.app.device).toBe('desktop')
    expect(store.state.app.sidebar.opened).toBe(false)
  })

  test('leaving layout removes the listener until a later mount', async() => {
    await start('/layout')
    await navigate('/login')
    width = 480
    window.dispatchEvent(new Event('resize'))
    await settle()
    expect(store.state.app.device).toBe('desktop')
    expect(store.state.app.sidebar.opened).toBe(true)
    await navigate('/layout')
    expect(store.state.app.device).toBe('mobile')
    expect(store.state.app.sidebar.opened).toBe(false)
  })
})
