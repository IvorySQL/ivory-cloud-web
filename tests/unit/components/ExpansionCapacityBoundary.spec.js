import { createLocalVue, mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import ElementUI from 'element-ui'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import AppMain from '@/layout/components/AppMain.vue'
import Expansion from '@/views/CloudNative/DBExpansion/index.vue'
import ExpansionDialog from '@/components/Dialog/ExpansionDialog.vue'

async function flush() {
  for (let index = 0; index < 20; index++) await Promise.resolve()
}

const instance = {
  id: 'instance-A',
  name: 'Database A',
  clusterName: 'Cluster A',
  namespace: 'default',
  status: 'RUNNING',
  version: '5.6',
  type: 'ALONE',
  storageClass: 'standard',
  storage: 20,
  cpu: 2,
  memory: 4,
  createdAt: '2026-10-28',
  network: [{ nodeIp: '192.0.2.10', nodePort: 30080 }]
}

describe('disk expansion requires a capacity increase', () => {
  let wrapper
  let transport
  let localVue
  let errors
  let message
  let savedUser
  let savedRoles

  beforeEach(async() => {
    jest.useFakeTimers()
    savedUser = localStorage.getItem('userId')
    savedRoles = localStorage.getItem('roles')
    localStorage.setItem('userId', 'user-7')
    localStorage.setItem('roles', JSON.stringify(['routine']))
    localVue = createLocalVue()
    localVue.use(VueRouter)
    localVue.use(ElementUI)
    errors = []
    localVue.config.errorHandler = error => errors.push(error)
    const client = axios.create()
    client.defaults.validateStatus = status => status >= 200 && status <= 500
    localVue.prototype.axios = client
    transport = new MockAdapter(client)
    transport.onGet('/instances/list/user-7').reply(200, [instance])
    transport.onGet('/clusters').reply(200, [])
    transport.onGet('/instances/instance-A').reply(200, instance)
    // Observe the real serialized request; do not fabricate a backend expansion result.
    transport.onPost('/instances/instance-A/action/storage')
      .reply(() => new Promise(() => {}))
    message = { success: jest.fn(), error: jest.fn() }
    localVue.prototype.$message = message
    const router = new VueRouter({
      mode: 'abstract',
      routes: [{ path: '/nativeCloud/DBExpansion/index', component: Expansion }]
    })
    router.push('/nativeCloud/DBExpansion/index')
    wrapper = mount(AppMain, { localVue, router, sync: false, stubs: { 'svg-icon': true, transition: false, 'transition-group': false }})
    await flush()
    await wrapper.vm.$nextTick()
    jest.advanceTimersByTime(200)
    await flush()
  })

  afterEach(() => {
    if (wrapper) wrapper.destroy()
    transport.restore()
    jest.clearAllTimers()
    jest.useRealTimers()
    if (savedUser === null) localStorage.removeItem('userId')
    else localStorage.setItem('userId', savedUser)
    if (savedRoles === null) localStorage.removeItem('roles')
    else localStorage.setItem('roles', savedRoles)
  })

  async function submitCapacity(value) {
    const row = wrapper.find('.el-table__body-wrapper').findAll('tbody tr').at(0)
    await row.find('button').trigger('click')
    await flush()
    await wrapper.vm.$nextTick()
    const dialog = wrapper.find(ExpansionDialog)
    expect(dialog.vm.storageExpansionVisible).toBe(true)
    expect(dialog.props('instanceId')).toBe('instance-A')
    expect(dialog.props('storageForm').storage).toBe(20)
    expect(transport.history.get.some(request => request.url === '/instances/instance-A')).toBe(true)
    await dialog.find('input').setValue(value)
    await dialog.find('.el-dialog__footer button.el-button--primary').trigger('click')
    await flush()
    await wrapper.vm.$nextTick()
    expect(errors).toEqual([])
    return dialog
  }

  it('rejects an unchanged capacity before sending an expansion request', async() => {
    // InstanceServiceImpl.extendInstance rejects storageSize <= current storage.
    const dialog = await submitCapacity('20')
    expect(transport.history.post).toHaveLength(0)
    expect(dialog.find('.el-form-item__error').text()).toBe('变更值必须大于原规格！')
    expect(dialog.vm.storageExpansionVisible).toBe(true)
  })

  it('keeps rejecting a capacity below the current value', async() => {
    const dialog = await submitCapacity('10')
    expect(transport.history.post).toHaveLength(0)
    expect(dialog.find('.el-form-item__error').exists()).toBe(true)
    expect(dialog.vm.storageExpansionVisible).toBe(true)
  })

  it('submits an actual increase to the selected instance', async() => {
    const dialog = await submitCapacity('40')
    expect(transport.history.post).toHaveLength(1)
    expect(transport.history.post[0].url).toBe('/instances/instance-A/action/storage')
    expect(JSON.parse(transport.history.post[0].data)).toEqual({ storageSize: '40' })
    expect(dialog.find('.el-form-item__error').exists()).toBe(false)
    expect(message.error).not.toHaveBeenCalled()
    expect(message.success).not.toHaveBeenCalled()
  })
})
