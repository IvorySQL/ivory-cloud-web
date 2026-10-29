import { createLocalVue, mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import ElementUI from 'element-ui'
import axios from 'axios'
import VueAxios from 'vue-axios'
import MockAdapter from 'axios-mock-adapter'
import AppMain from '@/layout/components/AppMain.vue'
import SvgIcon from '@/components/SvgIcon/index.vue'
import DBManage from '@/views/CloudNative/DBManage/index.vue'
import ExpansionDialog from '@/components/Dialog/ExpansionDialog.vue'

async function flush() {
  for (let index = 0; index < 30; index++) await Promise.resolve()
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
  createdAt: '2026-10-29',
  network: [{ nodeIp: '192.0.2.10', nodePort: 30080 }]
}
const storageUrl = '/instances/instance-A/action/storage'

describe('routed DBManage disk submit permits one pending request', () => {
  let wrapper
  let transport
  let errors
  let message
  let pending
  let nextFailure
  let savedUser
  let savedRoles

  beforeEach(async() => {
    jest.useFakeTimers()
    savedUser = localStorage.getItem('userId')
    savedRoles = localStorage.getItem('roles')
    localStorage.setItem('userId', 'user-7')
    localStorage.setItem('roles', JSON.stringify(['routine']))
    const localVue = createLocalVue()
    localVue.use(VueRouter)
    localVue.use(ElementUI)
    localVue.component('svg-icon', SvgIcon)
    errors = []
    pending = []
    nextFailure = null
    localVue.config.errorHandler = error => errors.push(error)
    const client = axios.create()
    // Exercise the existing non-200 response branch as well as rejection.
    client.defaults.validateStatus = status => status >= 200 && status <= 500
    localVue.use(VueAxios, client)
    transport = new MockAdapter(client)
    transport.onGet('/instances/list/user-7').reply(200, [instance])
    transport.onGet('/clusters').reply(200, [])
    transport.onGet('/instances/instance-A').reply(200, instance)
    transport.onPost(storageUrl).reply(() => {
      const failure = nextFailure
      nextFailure = null
      if (failure === 'network') return Promise.reject(new Error('network unavailable'))
      if (failure === 'HTTP') return [500, { message: 'storage service unavailable' }]
      return new Promise(resolve => pending.push(resolve))
    })
    message = { success: jest.fn(), error: jest.fn() }
    localVue.prototype.$message = message
    const router = new VueRouter({
      mode: 'abstract',
      routes: [{ path: '/nativeCloud/DBManage/index', component: DBManage }]
    })
    await router.push('/nativeCloud/DBManage/index')
    wrapper = mount(AppMain, {
      localVue,
      router,
      sync: false,
      stubs: { transition: false, 'transition-group': false }
    })
    await flush()
    await wrapper.vm.$nextTick()
    jest.advanceTimersByTime(200)
    await flush()
  })

  afterEach(async() => {
    // Settle actual Axios boundary promises before destroying real timer owners.
    pending.forEach(resolve => resolve([500, { message: 'cleanup' }]))
    await flush()
    if (wrapper) wrapper.destroy()
    wrapper = null
    transport.restore()
    jest.clearAllTimers()
    jest.useRealTimers()
    if (savedUser === null) localStorage.removeItem('userId')
    else localStorage.setItem('userId', savedUser)
    if (savedRoles === null) localStorage.removeItem('roles')
    else localStorage.setItem('roles', savedRoles)
  })

  async function openExpansion() {
    const dropdown = wrapper.findAll({ name: 'ElDropdown' }).wrappers
      .find(item => item.element.closest('.el-table__fixed-right'))
    expect(dropdown).toBeDefined()
    dropdown.find('button').element.click()
    jest.advanceTimersByTime(300)
    await flush()
    await wrapper.vm.$nextTick()
    const menu = dropdown.vm.popperElm
    expect(menu).toBeTruthy()
    const item = Array.from(menu.querySelectorAll('li'))
      .find(option => option.textContent.trim() === '磁盘扩容')
    expect(item).toBeDefined()
    expect(item.classList.contains('is-disabled')).toBe(false)
    item.click()
    await flush()
    const dialog = wrapper.find(ExpansionDialog)
    expect(dialog.vm.storageExpansionVisible).toBe(true)
    expect(dialog.props('instanceId')).toBe(instance.id)
    expect(dialog.props('storageForm').storage).toBe(20)
    await dialog.find('input').setValue('40')
    await flush()
    return dialog
  }

  function submitButton(dialog) {
    return dialog.find('.el-dialog__footer button.el-button--primary')
  }

  function expectTarget(index) {
    const request = transport.history.post[index]
    expect(request.url).toBe(storageUrl)
    expect(JSON.parse(request.data)).toEqual({ storageSize: '40' })
  }

  it('serializes rapid real confirm clicks and later clicks while HTTP is pending', async() => {
    const dialog = await openExpansion()
    // Two native DOM clicks in one turn also exercise the pre-render window.
    submitButton(dialog).element.click()
    submitButton(dialog).element.click()
    await flush()
    await wrapper.vm.$nextTick()
    expect(transport.history.post).toHaveLength(1)
    expectTarget(0)
    expect(dialog.vm.isButtonLoading).toBe(true)
    expect(submitButton(dialog).element.disabled).toBe(true)
    expect(submitButton(dialog).classes()).toContain('is-loading')
    submitButton(dialog).element.click()
    await flush()
    expect(transport.history.post).toHaveLength(1)
    expect(dialog.vm.storageExpansionVisible).toBe(true)
    expect(message.success).not.toHaveBeenCalled()
    expect(errors).toEqual([])
  })

  const failures = ['network', 'HTTP']
  failures.forEach(failure => {
    it('permits a normal retry after ' + failure + ' failure', async() => {
      const dialog = await openExpansion()
      nextFailure = failure
      submitButton(dialog).element.click()
      await flush()
      await wrapper.vm.$nextTick()
      expect(transport.history.post).toHaveLength(1)
      expectTarget(0)
      expect(dialog.vm.isButtonLoading).toBe(false)
      expect(submitButton(dialog).element.disabled).toBe(false)
      expect(dialog.vm.storageExpansionVisible).toBe(true)
      expect(message.error).toHaveBeenCalledTimes(1)

      // Only the HTTP transport is controlled; no backend/storage result is faked.
      submitButton(dialog).element.click()
      await flush()
      await wrapper.vm.$nextTick()
      expect(transport.history.post).toHaveLength(2)
      expectTarget(1)
      expect(dialog.vm.isButtonLoading).toBe(true)
      expect(errors).toEqual([])
    })
  })
})

