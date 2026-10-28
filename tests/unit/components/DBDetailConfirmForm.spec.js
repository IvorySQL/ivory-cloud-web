import { createLocalVue, mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import ElementUI from 'element-ui'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import AppMain from '@/layout/components/AppMain.vue'
import DBDetail from '@/views/CloudNative/DBDetail/index.vue'

async function flush() {
  for (let index = 0; index < 20; index++) await Promise.resolve()
}

describe('DBDetail description confirmation form binding', () => {
  let wrapper
  let transport
  let localVue
  let errors
  let message
  let savedDbtype

  beforeEach(async() => {
    jest.useFakeTimers()
    savedDbtype = global.dbtype
    global.dbtype = 'IvorySQL'
    localVue = createLocalVue()
    localVue.use(VueRouter)
    localVue.use(ElementUI)
    errors = []
    localVue.config.errorHandler = error => errors.push(error)
    const http = axios.create()
    http.defaults.validateStatus = status => status >= 200 && status <= 500
    localVue.prototype.axios = http
    transport = new MockAdapter(http)
    transport.onGet('/instances/database-1').reply(200, {
      id: 'database-1',
      name: 'Database one',
      type: 'ALONE',
      clusterName: 'Cluster one',
      version: '5.6',
      namespace: 'default',
      storageClass: 'standard',
      cpu: 2,
      memory: 4,
      storage: 20,
      status: 'RUNNING',
      description: 'Original',
      network: [{
        nodeIp: '192.0.2.10',
        nodePort: 30080,
        service: 'database-one.default.svc',
        port: 5432
      }]
    })
    transport.onGet('/instances/database-1/events').reply(200, {
      instanceId: 'database-1', nodeNum: 1, nodeReadyNum: 1
    })
    message = { success: jest.fn(), error: jest.fn() }
    localVue.prototype.$message = message
    const router = new VueRouter({
      mode: 'abstract',
      routes: [{ path: '/nativeCloud/DBDetail/index', component: DBDetail }]
    })
    router.push({ path: '/nativeCloud/DBDetail/index', query: { instanceId: 'database-1', flag: false }})
    wrapper = mount(AppMain, {
      localVue,
      router,
      sync: false,
      stubs: { 'svg-icon': true, transition: false, 'transition-group': false }
    })
    await flush()
    await wrapper.vm.$nextTick()
  })

  afterEach(() => {
    if (wrapper) wrapper.destroy()
    transport.restore()
    jest.clearAllTimers()
    jest.useRealTimers()
    if (savedDbtype === undefined) delete global.dbtype
    else global.dbtype = savedDbtype
  })

  async function openDescription() {
    const field = wrapper.findAll({ name: 'ElFormItem' }).wrappers
      .find(item => item.props('label') === '实例备注')
    expect(field).toBeDefined()
    await field.find('.el-icon-edit').trigger('click')
    await wrapper.vm.$nextTick()
    const dialog = wrapper.findAll({ name: 'ElDialog' }).wrappers
      .find(item => item.props('title') === '修改实例备注')
    expect(dialog).toBeDefined()
    expect(dialog.props('visible')).toBe(true)
    return dialog
  }

  function button(scope, text) {
    const found = scope.findAll('button').wrappers
      .find(item => item.text().replace(/\s/g, '') === text)
    expect(found).toBeDefined()
    return found
  }

  it('submits the description through the real confirmation button and form validation', async() => {
    transport.onPatch('/instances/database-1/description').reply(200, {})
    const dialog = await openDescription()
    await dialog.find('textarea').setValue('Updated')
    await button(dialog, '确定').trigger('click')
    await flush()
    await wrapper.vm.$nextTick()

    // The baseline receives the model object, dereferences $refs["[object Object]"],
    // raises a Vue event-handler error and never reaches the HTTP boundary.
    expect(errors).toEqual([])
    expect(transport.history.patch).toHaveLength(1)
    expect(transport.history.patch[0].url).toBe('/instances/database-1/description')
    expect(JSON.parse(transport.history.patch[0].data)).toEqual({ description: 'Updated' })
    expect(message.success).toHaveBeenCalledWith('修改实例描述成功')
    expect(dialog.props('visible')).toBe(false)
    // Refresh timing belongs to existing PR16 and is deliberately not asserted here.
  })

  it('loads the selected instance and displays its existing connection and resource fields', () => {
    expect(errors).toEqual([])
    expect(transport.history.get.map(request => request.url)).toEqual([
      '/instances/database-1',
      '/instances/database-1/events'
    ])
    expect(wrapper.text()).toContain('Database one')
    expect(wrapper.text()).toContain('192.0.2.10')
    expect(wrapper.text()).toContain('30080')
    expect(wrapper.text()).toContain('database-one.default.svc')
    expect(wrapper.text()).toContain('5432')
    expect(wrapper.text()).toContain('2 vCPUs | 4 GiB')
    expect(wrapper.text()).toContain('20 GiB')
    expect(transport.history.patch).toHaveLength(0)
  })

  it('can cancel editing without sending a description update', async() => {
    const dialog = await openDescription()
    await dialog.find('textarea').setValue('Unsaved')
    await button(dialog, '取消').trigger('click')
    await flush()
    await wrapper.vm.$nextTick()
    expect(errors).toEqual([])
    expect(transport.history.patch).toHaveLength(0)
    expect(dialog.props('visible')).toBe(false)
    expect(wrapper.text()).toContain('Original')
  })
})
