import { createLocalVue, mount } from '@vue/test-utils'
import ElementUI from 'element-ui'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import DashboardPage from '@/views/CloudNative/Dashboard/index.vue'

const localVue = createLocalVue()
localVue.use(ElementUI)

const resourceUrl = '/clusters/7/resource'
const countUrl = '/instances/action/count/7'

function resource(clusterId, clusterName, count) {
  // The actual K8sResourceCountVO response fields, not invented status names.
  return {
    clusterId,
    clusterName,
    instanceCount: count,
    runningInstanceCount: count,
    errorInstanceCount: 0,
    elseInstanceCount: 0,
    aloneInstanceCount: count,
    haInstanceCount: 0
  }
}

async function flush() {
  for (let index = 0; index < 6; index++) {
    await new Promise(resolve => setTimeout(resolve, 0))
  }
}

describe('dashboard resource request completion', () => {
  let app
  let client
  let transport
  let message
  let savedRoles
  let savedUserId

  beforeEach(() => {
    savedRoles = localStorage.getItem('roles')
    savedUserId = localStorage.getItem('userId')
    localStorage.setItem('roles', JSON.stringify(['routine']))
    localStorage.setItem('userId', '7')
    client = axios.create()
    transport = new MockAdapter(client)
    transport.onGet(countUrl).reply(200, {
      startingCount: 0,
      runningCount: 3,
      errorCount: 0
    })
    message = { error: jest.fn() }
  })

  afterEach(() => {
    // Run the genuine component's beforeDestroy to clear its 30-second timer.
    if (app) app.destroy()
    app = null
    transport.restore()
    if (savedRoles === null) localStorage.removeItem('roles')
    else localStorage.setItem('roles', savedRoles)
    if (savedUserId === null) localStorage.removeItem('userId')
    else localStorage.setItem('userId', savedUserId)
  })

  async function openPage() {
    // Mount the existing routed page and its actual native.vue child.
    app = mount(DashboardPage, {
      localVue,
      sync: false,
      mocks: { axios: client, $message: message },
      stubs: { transition: false, 'transition-group': false }
    })
    await flush()
    expect(transport.history.get.some(request => request.url === countUrl)).toBe(true)
    expect(transport.history.get.some(request => request.url === resourceUrl)).toBe(true)
    return app.find({ name: 'Dashboard' })
  }

  async function refresh() {
    await app.find('.el-icon-refresh-right').trigger('click')
    await flush()
  }

  it('ends a failed initial load and allows the visible refresh action to recover', async() => {
    const recovered = resource('cluster-a', 'Recovered cluster', 3)
    transport.onGet(resourceUrl).replyOnce(503, { message: 'temporarily unavailable' })
    transport.onGet(resourceUrl).reply(200, [recovered])

    const dashboard = await openPage()
    expect(message.error).toHaveBeenCalledTimes(1)
    expect(message.error.mock.calls[0][0]).toBeInstanceOf(Error)
    // Baseline remains true after the rejected Axios request.
    expect(dashboard.vm.loading).toBe(false)
    expect(app.findAll('.el-card').length).toBe(0)

    await refresh()
    expect(dashboard.vm.loading).toBe(false)
    expect(dashboard.vm.resourceList).toEqual([recovered])
    expect(app.findAll('.el-card').length).toBe(1)
    expect(app.text()).toContain('Recovered cluster')
    expect(transport.history.get.filter(request => request.url === resourceUrl)).toHaveLength(2)
  })

  it('ends a failed refresh instead of leaving existing resource cards hidden', async() => {
    const previous = resource('cluster-a', 'Existing cluster', 3)
    transport.onGet(resourceUrl).replyOnce(200, [previous])
    transport.onGet(resourceUrl).reply(503, { message: 'temporarily unavailable' })

    const dashboard = await openPage()
    expect(app.findAll('.el-card').length).toBe(1)
    await refresh()

    expect(message.error).toHaveBeenCalledTimes(1)
    expect(dashboard.vm.loading).toBe(false)
    expect(dashboard.vm.resourceList).toEqual([previous])
    expect(app.findAll('.el-card').length).toBe(1)
    expect(app.text()).toContain('Existing cluster')
  })

  it('still renders the supported resource response on initial success', async() => {
    const current = resource('cluster-a', 'Initial cluster', 3)
    transport.onGet(resourceUrl).reply(200, [current])

    const dashboard = await openPage()

    expect(dashboard.vm.loading).toBe(false)
    expect(dashboard.vm.resourceList).toEqual([current])
    expect(app.findAll('.el-card').length).toBe(1)
    expect(app.text()).toContain('Initial cluster')
    expect(app.text()).toContain('数据库总数：3')
    expect(message.error).not.toHaveBeenCalled()
  })

  it('still replaces resource cards after a successful refresh', async() => {
    const first = resource('cluster-a', 'First cluster', 3)
    const second = resource('cluster-b', 'Second cluster', 4)
    transport.onGet(resourceUrl).replyOnce(200, [first])
    transport.onGet(resourceUrl).reply(200, [second])

    const dashboard = await openPage()
    expect(app.text()).toContain('First cluster')
    await refresh()

    expect(dashboard.vm.loading).toBe(false)
    expect(dashboard.vm.resourceList).toEqual([second])
    expect(app.text()).toContain('Second cluster')
    expect(app.text()).not.toContain('First cluster')
    expect(app.text()).toContain('数据库总数：4')
    expect(message.error).not.toHaveBeenCalled()
  })
})
