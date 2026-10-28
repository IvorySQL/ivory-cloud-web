import { createLocalVue, mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import ElementUI from 'element-ui'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import AppMain from '@/layout/components/AppMain.vue'
import DBManage from '@/views/CloudNative/DBManage/index.vue'
import ConfirmDialog from '@/components/Dialog/ConfirmDialog.vue'

async function flush() {
  for (let index = 0; index < 24; index++) await Promise.resolve()
}

function instance(id) {
  return {
    id,
    name: 'Database ' + id,
    clusterName: 'Cluster ' + id,
    namespace: 'default',
    status: 'RUNNING',
    version: '5.6',
    type: 'ALONE',
    storageClass: 'standard',
    storage: 20,
    cpu: 2,
    memory: 4,
    network: [{ nodeIp: '192.0.2.10', nodePort: 30080 }]
  }
}

const operations = [
  { name: 'restart', menu: '重启', option: '重启', method: 'post', suffix: '/action/restart' },
  { name: 'delete', menu: '删除实例', option: '删除', method: 'delete', suffix: '' }
]

describe('ConfirmDialog callbacks belong to the open confirmation', () => {
  let wrapper
  let localVue
  let transport
  let pending
  let message
  let errors
  let savedRoles
  let savedUser

  beforeEach(async() => {
    jest.useFakeTimers()
    savedRoles = localStorage.getItem('roles')
    savedUser = localStorage.getItem('userId')
    localStorage.setItem('roles', JSON.stringify(['routine']))
    localStorage.setItem('userId', 'user-7')
    localVue = createLocalVue()
    localVue.use(VueRouter)
    localVue.use(ElementUI)
    errors = []
    localVue.config.errorHandler = error => errors.push(error)
    const client = axios.create()
    client.defaults.validateStatus = status => status >= 200 && status <= 500
    localVue.prototype.axios = client
    transport = new MockAdapter(client)
    transport.onGet('/instances/list/user-7').reply(200, [instance('A'), instance('B')])
    transport.onGet('/clusters').reply(200, [])
    pending = []
    const waitForResponse = config => new Promise(resolve => {
      pending.push({ method: config.method, url: config.url, resolve })
    })
    transport.onPost(/^\/instances\/[^/]+\/action\/restart$/).reply(waitForResponse)
    transport.onDelete(/^\/instances\/[^/]+$/).reply(waitForResponse)
    message = jest.fn()
    message.error = jest.fn()
    localVue.prototype.$message = message
    const router = new VueRouter({
      mode: 'abstract',
      routes: [{ path: '/nativeCloud/DBManage/index', component: DBManage }]
    })
    router.push('/nativeCloud/DBManage/index')
    wrapper = mount(AppMain, { localVue, router, sync: false, stubs: { 'svg-icon': true, transition: false, 'transition-group': false }})
    await flush()
    await wrapper.vm.$nextTick()
    jest.advanceTimersByTime(200)
    await flush()
  })

  afterEach(async() => {
    // Settle the real HTTP boundary before destruction; do not leave transport promises pending.
    pending.forEach(request => request.resolve([200, { code: 200, success: true }]))
    await flush()
    if (wrapper) wrapper.destroy()
    transport.restore()
    jest.clearAllTimers()
    jest.useRealTimers()
    if (savedRoles === null) localStorage.removeItem('roles')
    else localStorage.setItem('roles', savedRoles)
    if (savedUser === null) localStorage.removeItem('userId')
    else localStorage.setItem('userId', savedUser)
  })

  function dialog() {
    return wrapper.find(ConfirmDialog)
  }

  function button(scope, label) {
    const match = scope.findAll('button').wrappers
      .find(item => item.text().replace(/\s/g, '') === label)
    expect(match).toBeDefined()
    return match
  }

  async function open(id, operation) {
    const dropdown = wrapper.findAll({ name: 'ElDropdown' }).wrappers.find(item => {
      const row = item.element.closest('tr')
      return row && row.textContent.includes('Database ' + id)
    })
    expect(dropdown).toBeDefined()
    await dropdown.find('button').trigger('click')
    await wrapper.vm.$nextTick()
    const menuItem = dropdown.findAll({ name: 'ElDropdownItem' }).wrappers
      .find(item => item.text() === operation.menu)
    expect(menuItem).toBeDefined()
    await menuItem.trigger('click')
    await flush()
    await wrapper.vm.$nextTick()
    expect(dialog().vm.confirmVisible).toBe(true)
    expect(dialog().props('instanceId')).toBe(id)
    expect(dialog().props('option')).toBe(operation.option)
    expect(dialog().text()).toContain('Database ' + id)
  }

  async function submit(id, operation) {
    const count = pending.length
    await button(dialog(), '确定').trigger('click')
    await flush()
    await wrapper.vm.$nextTick()
    expect(pending).toHaveLength(count + 1)
    expect(pending[count].method).toBe(operation.method)
    expect(pending[count].url).toBe('/instances/' + id + operation.suffix)
    expect(dialog().vm.isButtonLoading).toBe(true)
    return count
  }

  async function cancel() {
    const cancelButton = button(dialog(), '取消')
    expect(cancelButton.element.disabled).toBe(false)
    await cancelButton.trigger('click')
    await flush()
    await wrapper.vm.$nextTick()
    expect(dialog().vm.confirmVisible).toBe(false)
    expect(wrapper.find(DBManage).vm.instanceId).toBe('')
  }

  async function finish(index, status = 200) {
    pending[index].resolve([status, status === 200 ? { code: 200, success: true } : {}])
    await flush()
    await wrapper.vm.$nextTick()
  }

  operations.forEach(operation => {
    it('keeps B open after an old A ' + operation.name + ' succeeds', async() => {
      await open('A', operation)
      const first = await submit('A', operation)
      await cancel()
      await open('B', operation)
      await finish(first)
      jest.advanceTimersByTime(301)
      await flush()
      await wrapper.vm.$nextTick()

      expect(errors).toEqual([])
      expect(dialog().vm.confirmVisible).toBe(true)
      expect(dialog().props('instanceId')).toBe('B')
      expect(wrapper.find(DBManage).vm.instanceId).toBe('B')
      expect(dialog().text()).toContain('Database B')
      expect(message).not.toHaveBeenCalled()
      expect(pending).toHaveLength(1)
    })

    it('keeps B loading after an old A ' + operation.name + ' request rejects', async() => {
      await open('A', operation)
      const first = await submit('A', operation)
      await cancel()
      await open('B', operation)
      await submit('B', operation)
      // HTTP503 rejects the actual Axios promise under the production validateStatus policy.
      await finish(first, 503)

      expect(errors).toEqual([])
      expect(dialog().vm.confirmVisible).toBe(true)
      expect(dialog().props('instanceId')).toBe('B')
      expect(dialog().vm.isButtonLoading).toBe(true)
      expect(message.error).not.toHaveBeenCalled()
      expect(message).not.toHaveBeenCalled()
    })

    it('still reports an active ' + operation.name + ' rejection and permits retry', async() => {
      await open('A', operation)
      const current = await submit('A', operation)
      await finish(current, 503)

      expect(errors).toEqual([])
      expect(dialog().vm.confirmVisible).toBe(true)
      expect(dialog().props('instanceId')).toBe('A')
      expect(dialog().vm.isButtonLoading).toBe(false)
      expect(button(dialog(), '确定').element.disabled).toBe(false)
      expect(message.error).toHaveBeenCalledTimes(1)
      expect(message).not.toHaveBeenCalled()
    })

    it('still completes the active ' + operation.name + ' and refreshes the parent', async() => {
      await open('A', operation)
      const current = await submit('A', operation)
      const previousLoads = transport.history.get
        .filter(request => request.url === '/instances/list/user-7').length
      await finish(current)
      jest.advanceTimersByTime(301)
      await flush()
      await wrapper.vm.$nextTick()

      expect(errors).toEqual([])
      expect(dialog().vm.confirmVisible).toBe(false)
      expect(wrapper.find(DBManage).vm.instanceId).toBe('')
      expect(message).toHaveBeenCalledTimes(1)
      expect(message.mock.calls[0][0].type).toBe('success')
      expect(transport.history.get.filter(request => request.url === '/instances/list/user-7').length)
        .toBe(previousLoads + 1)
      expect(message.error).not.toHaveBeenCalled()
    })
  })

  it('distinguishes two openings of the same instance', async() => {
    const operation = operations[0]
    await open('A', operation)
    const first = await submit('A', operation)
    await cancel()
    await open('A', operation)
    await finish(first)

    expect(errors).toEqual([])
    expect(dialog().vm.confirmVisible).toBe(true)
    expect(dialog().props('instanceId')).toBe('A')
    expect(wrapper.find(DBManage).vm.instanceId).toBe('A')
    expect(message).not.toHaveBeenCalled()
  })
})
