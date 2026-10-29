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

describe('DBDetail password dialog request ownership', () => {
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

  function button(scope, text) {
    const found = scope.findAll('button').wrappers.find(item => item.text().replace(/\s/g, '') === text)
    expect(found).toBeDefined()
    return found
  }
  async function openPassword(name) {
    const row = wrapper.findAll('tr').wrappers.find(item => item.text().includes(name))
    expect(row).toBeDefined()
    await row.find('.el-icon-edit').trigger('click')
    await flush()
    await wrapper.vm.$nextTick()
    const dialog = wrapper.findAll({ name: 'ElDialog' }).wrappers.find(item => item.props('title') === '修改密码')
    expect(dialog.props('visible')).toBe(true)
    const inputs = dialog.findAll('input')
    await inputs.at(0).setValue('ValidPass123!')
    await inputs.at(1).setValue('ValidPass123!')
    return dialog
  }
  for (const status of [200, 500]) {
    it('keeps a reopened dialog and its pending request intact after an obsolete ' + status + ' response', async() => {
      let finishOld
      let finishCurrent
      transport.onPut('/instances/database-1/users/sysdba/reset-password').reply(() => new Promise(resolve => { finishOld = resolve }))
      transport.onPut('/instances/database-1/users/syssso/reset-password').reply(() => new Promise(resolve => { finishCurrent = resolve }))
      const dialog = await openPassword('sysdba')
      await button(dialog, '确定').trigger('click')
      await flush()
      expect(transport.history.put).toHaveLength(1)
      await button(dialog, '取消').trigger('click')
      await flush()
      await wrapper.vm.$nextTick()
      await openPassword('syssso')
      await button(dialog, '确定').trigger('click')
      await flush()
      expect(transport.history.put).toHaveLength(2)
      finishOld([status, { message: 'Old response' }])
      await flush()
      await wrapper.vm.$nextTick()
      expect(dialog.props('visible')).toBe(true)
      expect(dialog.text()).toContain('syssso')
      expect(dialog.findAll('input').at(0).element.value).toBe('ValidPass123!')
      expect(button(dialog, '确定').classes()).toContain('is-loading')
      expect(message.success).not.toHaveBeenCalled()
      expect(message.error).not.toHaveBeenCalled()
      finishCurrent([200, {}])
      await flush()
      await wrapper.vm.$nextTick()
      expect(dialog.props('visible')).toBe(false)
      expect(message.success).toHaveBeenCalledTimes(1)
      expect(errors).toEqual([])
    })
    it('retains the active ' + status + ' response behavior', async() => {
      transport.onPut('/instances/database-1/users/sysdba/reset-password').reply(status, { message: 'Current response' })
      const dialog = await openPassword('sysdba')
      await button(dialog, '确定').trigger('click')
      await flush()
      await wrapper.vm.$nextTick()
      expect(transport.history.put).toHaveLength(1)
      expect(JSON.parse(transport.history.put[0].data)).toEqual({ password: 'ValidPass123!' })
      expect(dialog.props('visible')).toBe(status !== 200)
      if (status === 200) expect(message.success).toHaveBeenCalledWith('重置密码成功')
      else {
        expect(message.error).toHaveBeenCalledWith('Current response！')
        expect(button(dialog, '确定').classes()).not.toContain('is-loading')
      }
      expect(errors).toEqual([])
    })
  }
})
