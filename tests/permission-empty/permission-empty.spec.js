const Vue = require('vue')
const ElementUI = require('element-ui')
const axios = require('axios')
const checkPermission = require('@/utils/permission').default
const auth = require('@/utils/auth')
const DataStorageServer = require('@/views/CloudNative/DataStorageServer/index.vue').default

Vue.use(ElementUI)
const originalErrorHandler = Vue.config.errorHandler
const originalAxios = Vue.prototype.axios
let renderErrors
let vm
let completeResponse

async function flush() {
  await Promise.resolve()
  await Promise.resolve()
  await Vue.nextTick()
  await Promise.resolve()
  await Vue.nextTick()
}

function mountPage() {
  // Real Axios with a deferred HTTP-200 transport boundary; no network or
  // replacement component methods. The actual mounted/getTableList path runs.
  const client = axios.create()
  client.defaults.adapter = config => new Promise(resolve => {
    expect(config.url).toBe('/clusters')
    completeResponse = () => resolve({
      data: '[]', status: 200, statusText: 'OK', headers: {}, config,
      request: { fixture: 'deferred clusters transport' }
    })
  })
  Vue.prototype.axios = client
  vm = new Vue({ render: h => h(DataStorageServer) }).$mount()
  document.body.appendChild(vm.$el)
}

function hasAddButton() {
  if (!vm.$el.querySelectorAll) return false
  return Array.from(vm.$el.querySelectorAll('button'))
    .some(button => button.textContent.includes('增加Kubernetes集群'))
}

beforeEach(() => {
  localStorage.clear()
  vm = null
  completeResponse = null
  renderErrors = []
  Vue.config.errorHandler = error => { renderErrors.push(error.message) }
})

afterEach(async () => {
  try {
    if (completeResponse) completeResponse()
    await flush()
  } finally {
    if (vm) {
      const element = vm.$el
      vm.$destroy() // actual beforeDestroy clears the component interval
      if (element.parentNode) element.parentNode.removeChild(element)
    }
    ElementUI.Message.closeAll()
    Vue.config.errorHandler = originalErrorHandler
    Vue.prototype.axios = originalAxios
    localStorage.clear()
  }
})

test.each([
  ['missing roles', undefined],
  ['JSON null roles', 'null'],
  ['JSON object roles', '{}'],
  ['JSON string roles', '"admin"'],
  ['JSON number roles', '1']
])('%s denies without throwing', (name, stored) => {
  if (stored !== undefined) localStorage.setItem('roles', stored)
  expect(checkPermission(['admin'])).toBe(false)
})

test('actual logout storage helper leaves a safe Boolean permission result', () => {
  localStorage.setItem('roles', JSON.stringify(['admin']))
  expect(checkPermission(['admin'])).toBe(true)
  auth.removeLocalstoragesSavedAsLogined()
  expect(localStorage.getItem('roles')).toBeNull()
  expect(checkPermission(['admin'])).toBe(false)
})

test.each([
  ['admin match', ['admin'], ['admin'], true],
  ['editor overlap', ['editor'], ['admin', 'editor'], true],
  ['nonmatching roles', ['editor'], ['admin'], false],
  ['empty array roles', [], ['admin'], false]
])('%s retains existing matching', (name, roles, requested, expected) => {
  localStorage.setItem('roles', JSON.stringify(roles))
  expect(checkPermission(requested)).toBe(expected)
})

test('malformed JSON still throws instead of introducing a recovery policy', () => {
  localStorage.setItem('roles', '{')
  expect(() => checkPermission(['admin'])).toThrow(SyntaxError)
})

test('complete real DataStorageServer renders safely with missing roles', async () => {
  mountPage()
  await flush()
  expect(renderErrors).toEqual([])
  expect(hasAddButton()).toBe(false)
})

test('real cache removal followed by a pending list response does not break rendering', async () => {
  localStorage.setItem('roles', JSON.stringify(['admin']))
  mountPage()
  await flush()
  expect(renderErrors).toEqual([])
  expect(hasAddButton()).toBe(true)
  expect(typeof completeResponse).toBe('function')
  // Explicitly model a still-mounted component during cleanup. This is not a
  // full router/logout timing test and does not assert every logout races.
  auth.removeLocalstoragesSavedAsLogined()
  completeResponse()
  await flush()
  expect(renderErrors).toEqual([])
  expect(hasAddButton()).toBe(false)
  expect(vm.$children[0].listLoading).toBe(false)
})
