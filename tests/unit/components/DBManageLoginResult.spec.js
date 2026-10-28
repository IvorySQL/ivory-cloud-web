import { createLocalVue, mount } from '@vue/test-utils'
import ElementUI from 'element-ui'
import VueRouter from 'vue-router'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import DBManage from '@/views/CloudNative/DBManage/index.vue'

const localVue = createLocalVue()
localVue.use(ElementUI)
localVue.use(VueRouter)

async function flush() {
  for (let i = 0; i < 20; i++) await Promise.resolve()
}

describe('DBManage database login result', () => {
  let wrapper
  let http
  let transport
  let open
  let error

  beforeEach(async() => {
    jest.useFakeTimers()
    localStorage.setItem('roles', JSON.stringify(['routine']))
    localStorage.setItem('userId', '7')
    http = axios.create()
    // Match the Axios status policy configured by src/main.js.
    http.defaults.validateStatus = status => status >= 200 && status <= 500
    localVue.prototype.axios = http
    transport = new MockAdapter(http)
    transport.onGet('/instances/list/7').reply(200, [{
      id: 'database-1',
      name: 'database-one',
      status: 'RUNNING',
      version: '5.6',
      type: 'ALONE',
      namespace: 'default',
      clusterName: 'cluster-one',
      clusterId: 'cluster-1',
      storageClass: 'standard',
      storage: 10,
      cpu: 1,
      memory: 1,
      network: [{ nodeIp: '192.0.2.10', nodePort: 5432 }],
      createdAt: '2026-10-28'
    }])
    transport.onGet('/clusters').reply(200, [])
    error = jest.fn()
    open = jest.spyOn(window, 'open').mockImplementation(() => null)
    const router = new VueRouter({
      mode: 'abstract',
      routes: [{ path: '/nativeCloud/DBManage/index', component: DBManage }]
    })
    router.push('/nativeCloud/DBManage/index')
    wrapper = mount(DBManage, {
      localVue,
      router,
      sync: false,
      stubs: { transition: false, 'transition-group': false },
      mocks: { $message: { error }}
    })
    await flush()
    await wrapper.vm.$nextTick()
  })

  afterEach(() => {
    if (wrapper) wrapper.destroy()
    transport.restore()
    open.mockRestore()
    localStorage.removeItem('roles')
    localStorage.removeItem('userId')
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  async function login() {
    const more = wrapper.findAll('button').wrappers.find(button => button.text().includes('更多'))
    expect(more).toBeDefined()
    await more.trigger('click')
    await wrapper.vm.$nextTick()
    const item = wrapper.findAll({ name: 'ElDropdownItem' }).wrappers
      .find(component => component.text() === '登录')
    expect(item).toBeDefined()
    await item.trigger('click')
    await flush()
    await wrapper.vm.$nextTick()
    expect(transport.history.get.filter(request => request.url === '/instances/database-1/hgadmin'))
      .toHaveLength(1)
  }

  it('reports an application failure without opening its message as a URL', async() => {
    // InstanceServiceImpl.getHgadminUrl returns actionFailed(message) when no port is available.
    // ActionResponse.actionFailed(String): HTTP 200 body with code 201 and success false.
    const message = 'Service exception, please try again.'
    transport.onGet('/instances/database-1/hgadmin').reply(200, {
      code: 201, success: false, message, status: null
    })
    await login()
    expect(open).not.toHaveBeenCalled()
    expect(error).toHaveBeenCalledWith(message)
  })

  it('opens the address from a successful action response', async() => {
    transport.onGet('/instances/database-1/hgadmin').reply(200, {
      code: 200, success: true, message: '192.0.2.10:30080', status: null
    })
    await login()
    expect(open).toHaveBeenCalledTimes(1)
    expect(open).toHaveBeenCalledWith('http://192.0.2.10:30080', '_blank')
    expect(error).not.toHaveBeenCalled()
  })

  it('reports an HTTP failure without opening a window', async() => {
    transport.onGet('/instances/database-1/hgadmin').reply(500, { message: 'Unavailable' })
    await login()
    expect(open).not.toHaveBeenCalled()
    expect(error).toHaveBeenCalledTimes(1)
  })

  it('reports a network failure without opening a window', async() => {
    transport.onGet('/instances/database-1/hgadmin').networkError()
    await login()
    expect(open).not.toHaveBeenCalled()
    expect(error).toHaveBeenCalledTimes(1)
  })
})
