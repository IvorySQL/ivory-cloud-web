import router from '@/router'
import store from '@/store'
import { getToken, setToken, removeToken } from '@/utils/auth'
import '@/permission'

// Styles do not participate in the guard or session state.
jest.mock('nprogress/nprogress.css', () => ({}))

// Only replace the root module auto-discovery (webpack require.context).
// Both namespaced modules, their mutations/actions, auth helpers and the
// registered production router guard remain real.
jest.mock('@/store', () => {
  const Vue = require('vue').default || require('vue')
  const Vuex = require('vuex').default || require('vuex')
  Vue.use(Vuex)
  const previous = global.disableNative
  global.disableNative = false
  const user = require('@/store/modules/user').default
  const permission = require('@/store/modules/permission').default
  global.disableNative = previous
  return new Vuex.Store({
    modules: { user, permission },
    getters: require('@/store/getters').default
  })
})

jest.mock('@/layout', () => ({
  name: 'UnusedLayout',
  render: h => h('div')
}))

// These request functions are not called by the selected session path.
// Mocking their module avoids importing an unrelated Axios/store cycle.
jest.mock('@/api/user', () => ({
  getInfo: jest.fn(),
  subscribe: jest.fn()
}))

jest.mock('nprogress', () => ({
  configure: jest.fn(),
  start: jest.fn(),
  done: jest.fn()
}))

describe('session reset during router recovery', () => {
  const originalDisableNative = global.disableNative
  let guard
  let log
  let error

  beforeAll(() => {
    expect(router.beforeHooks).toHaveLength(1)
    guard = router.beforeHooks[0]
  })

  beforeEach(() => {
    localStorage.clear()
    removeToken()
    store.commit('user/RESET_STATE')
    global.disableNative = false
    log = jest.spyOn(console, 'log').mockImplementation(() => {})
    error = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    localStorage.clear()
    removeToken()
    store.commit('user/RESET_STATE')
    log.mockRestore()
    error.mockRestore()
  })

  afterAll(() => {
    if (originalDisableNative === undefined) {
      delete global.disableNative
    } else {
      global.disableNative = originalDisableNative
    }
  })

  function seedLogin() {
    localStorage.setItem('XAUTHTOKEN', 'synthetic-session-token')
    localStorage.setItem('userId', 'user-123')
    localStorage.setItem('userName', 'Example User')
    localStorage.setItem('roles', JSON.stringify(['routine']))
    localStorage.setItem('unrelatedPreference', 'keep')
  }

  function expectClearedSession() {
    expect(localStorage.getItem('XAUTHTOKEN')).toBeNull()
    expect(localStorage.getItem('userId')).toBeNull()
    expect(localStorage.getItem('userName')).toBeNull()
    expect(localStorage.getItem('roles')).toBeNull()
    expect(localStorage.getItem('unrelatedPreference')).toBe('keep')
    expect(store.state.user.roles).toEqual([])
    expect(store.state.user.name).toBe('')
  }

  async function initializeHiddenNativeSession() {
    seedLogin()
    // Supported deployment switch from public/config.js. The actual current
    // generateRoutes action rejects because no accessedRoutes value is built.
    // The test exercises error recovery; it does not replace or fix that action.
    global.disableNative = true
    const next = jest.fn()
    await guard({ path: '/Dashboard/index', meta: {}}, {}, next)
    expect(error).toHaveBeenCalled()
    expect(next).toHaveBeenCalledTimes(1)
    expect(next).toHaveBeenCalledWith('/UserLogin')
  }

  it('removes the active local-storage session as well as the legacy cookie', async() => {
    seedLogin()
    setToken('synthetic-cookie-token')
    store.commit('user/SET_TOKEN', 'synthetic-cookie-token')
    store.commit('user/SET_ROLES', ['routine'])
    store.commit('user/SET_NAME', 'Example User')
    await store.dispatch('user/resetToken')
    expect(getToken()).toBeUndefined()
    expect(store.state.user.token).toBeFalsy()
    expectClearedSession()
  })

  it('clears login storage when the real route initialization rejects', async() => {
    await initializeHiddenNativeSession()
    expectClearedSession()
  })

  it('admits the recovery login page rather than redirecting it again', async() => {
    await initializeHiddenNativeSession()
    const next = jest.fn()
    // Deliberately drive only two guard calls. Starting a real redirect loop
    // would hang the failing baseline instead of giving a bounded assertion.
    await guard({ path: '/UserLogin', meta: {}}, {}, next)
    expect(next).toHaveBeenCalledTimes(1)
    expect(next.mock.calls[0]).toEqual([])
  })

  it('keeps a valid session when the normal route initialization succeeds', async() => {
    seedLogin()
    const next = jest.fn()
    await guard({ path: '/Dashboard/index', meta: {}}, {}, next)
    expect(error).not.toHaveBeenCalled()
    expect(store.state.user.roles).toEqual(['routine'])
    expect(localStorage.getItem('XAUTHTOKEN')).toBe('synthetic-session-token')
    expect(next).toHaveBeenCalledWith({
      path: '/Dashboard/index', meta: {}, replace: true
    })
  })

  it('retains normal explicit logout cleanup', async() => {
    seedLogin()
    store.commit('user/SET_ROLES', ['routine'])
    store.commit('user/SET_NAME', 'Example User')
    await store.dispatch('user/logout')
    expectClearedSession()
  })

  it('allows an already logged-out visitor to reach the login page', async() => {
    const next = jest.fn()
    await guard({ path: '/UserLogin', meta: {}}, {}, next)
    expect(next).toHaveBeenCalledTimes(1)
    expect(next.mock.calls[0]).toEqual([])
  })
})
