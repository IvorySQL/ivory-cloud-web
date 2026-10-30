// Real Axios, Element UI, js-cookie and the complete production request/auth/API
// modules. Only HTTP transport and the application-store boundary are fixtures.
const Vue = require('vue')
const { Message } = require('element-ui')
const settle = require('axios/lib/core/settle')
const service = require('@/utils/request').default
const auth = require('@/utils/auth')
const store = require('@/store')
const user = require('@/api/user')
const table = require('@/api/table')

function responseAdapter(payload, httpStatus = 200, inspect = () => {}) {
  return config => {
    inspect(config)
    return new Promise((resolve, reject) => {
      // Use Axios's actual settle and JSON response transform, not a replacement
      // Axios instance or directly invoked/extracted interceptor callback.
      settle(resolve, reject, {
        data: JSON.stringify(payload),
        status: httpStatus,
        statusText: String(httpStatus),
        headers: { 'content-type': 'application/json' },
        config,
        request: { fixture: 'HTTP transport boundary' }
      })
    })
  }
}

function displayedMessages() {
  return Array.from(document.querySelectorAll('.el-message__content')).map(node => node.textContent)
}

beforeEach(() => {
  jest.useFakeTimers() // UI duration/transition boundary, not Axios promises
  store.state.token = ''
  auth.removeToken()
})

afterEach(async () => {
  auth.removeToken()
  store.state.token = ''
  Message.closeAll()
  await Vue.nextTick()
  jest.runOnlyPendingTimers()
  await Vue.nextTick()
  jest.clearAllTimers()
  jest.useRealTimers()
})

test('HTTP-200 logical failure rejects with the displayed message', async () => {
  service.defaults.adapter = responseAdapter({ status: 400, message: 'Request refused' })
  await expect(service.get('/fixture')).rejects.toThrow('Request refused')
  await Vue.nextTick()
  expect(displayedMessages()).toContain('Request refused')
})

test('existing default error message is also the rejection reason', async () => {
  service.defaults.adapter = responseAdapter({ status: 500, message: '' })
  await expect(service.get('/fixture')).rejects.toThrow('Error')
  await Vue.nextTick()
  expect(displayedMessages()).toContain('Error')
})

test('actual subscribe API does not run its consumer success callback on logical failure', async () => {
  let requestedUrl
  service.defaults.adapter = responseAdapter({ status: 403, message: 'Subscription refused' }, 200,
    config => { requestedUrl = config.url })
  const succeeded = jest.fn()
  const rejected = jest.fn()
  await user.subscribe({ plan: 'fixture' }).then(succeeded, rejected)
  expect(requestedUrl).toBe('/huawei/createVM')
  expect(succeeded).not.toHaveBeenCalled()
  expect(rejected).toHaveBeenCalledTimes(1)
  expect(rejected.mock.calls[0][0].message).toBe('Subscription refused')
})

test('actual getInfo API preserves the useful rejection instead of undefined success', async () => {
  service.defaults.adapter = responseAdapter({ status: 401, message: 'Information refused' }, 200, config => {
    expect(config.params).toEqual({ token: 'fixture-token' })
  })
  await expect(user.getInfo('fixture-token')).rejects.toThrow('Information refused')
})

test('existing status-200 success body passes through the actual table API', async () => {
  const body = { status: 200, message: 'ok', data: { items: [{ id: 1 }] } }
  service.defaults.adapter = responseAdapter(body, 200, config => {
    expect(config.url).toBe('/vue-admin-template/table/list')
    expect(config.params).toEqual({ page: 1 })
  })
  await expect(table.getList({ page: 1 })).resolves.toEqual(body)
})

test('transport rejection preserves the original error object', async () => {
  const failure = new Error('transport offline')
  service.defaults.adapter = () => Promise.reject(failure)
  await expect(service.get('/fixture')).rejects.toBe(failure)
})

test('actual Axios settle still rejects non-success HTTP status', async () => {
  service.defaults.adapter = responseAdapter({ status: 200 }, 503)
  await expect(service.get('/fixture')).rejects.toThrow('Request failed with status code 503')
})

test('request interceptor still reads the actual auth cookie when token getter is set', async () => {
  store.state.token = 'getter-enabled'
  auth.setToken('cookie-token')
  service.defaults.adapter = responseAdapter({ status: 200 }, 200, config => {
    expect(config.headers['X-Token']).toBe('cookie-token')
    expect(config.headers['Content-Type']).toBe('application/x-www-form-urlencoded')
    expect(config.timeout).toBe(5000)
  })
  await expect(service.get('/fixture')).resolves.toEqual({ status: 200 })
})

test('request interceptor still omits X-Token when the token getter is empty', async () => {
  auth.setToken('cookie-that-is-not-enabled')
  service.defaults.adapter = responseAdapter({ status: 200 }, 200, config => {
    expect(config.headers['X-Token']).toBeUndefined()
  })
  await expect(service.get('/fixture')).resolves.toEqual({ status: 200 })
})
