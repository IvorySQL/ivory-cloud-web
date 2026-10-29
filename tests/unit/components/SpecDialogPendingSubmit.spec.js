import { createLocalVue, mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import VueAxios from 'vue-axios'
import ElementUI from 'element-ui'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import AppMain from '@/layout/components/AppMain.vue'
import DBManage from '@/views/CloudNative/DBManage/index.vue'
import SpecDialog from '@/components/Dialog/SpecDialog.vue'
import SvgIcon from '@/components/SvgIcon/index.vue'

async function flush() {
  for (let index = 0; index < 20; index++) await Promise.resolve()
}

// Ordinary InstanceVO data: cpu/memory are Integer JSON numbers, not strings.
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
  createdAt: '2026-10-29 08:00:00',
  network: [{ nodeIp: '192.0.2.10', nodePort: 30080 }]
}

const modifyUrl = '/instances/instance-A/action/modify-spec'

describe('real DBManage specification confirmation while a request is pending', () => {
  let wrapper
  let transport
  let errors
  let responsePlan
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
    localVue.config.errorHandler = error => errors.push(error)
    const client = axios.create()
    // Match the application's main.js status policy, rather than changing it
    // just to force a rejection branch in this regression.
    client.defaults.validateStatus = status => status >= 200 && status <= 500
    localVue.use(VueAxios, client)
    transport = new MockAdapter(client)
    transport.onGet('/instances/list/user-7').reply(200, [instance])
    transport.onGet('/clusters').reply(200, [])
    transport.onGet('/instances/instance-A').reply(200, instance)
    // Only the HTTP boundary is controlled. No successful backend job is
    // invented: the normal request remains in flight until test cleanup.
    responsePlan = []
    transport.onPost(modifyUrl).reply(() => responsePlan.length
      ? responsePlan.shift()
      : new Promise(() => {}))
    const router = new VueRouter({
      mode: 'abstract',
      routes: [{ path: '/nativeCloud/DBManage/index', component: DBManage }]
    })
    router.push('/nativeCloud/DBManage/index')
    wrapper = mount(AppMain, {
      localVue,
      router,
      attachToDocument: true,
      sync: false,
      // Disable test-utils' transition replacements. All application and
      // ElementUI components, including SvgIcon, are the real components.
      stubs: { transition: false, 'transition-group': false }
    })
    await flush()
    await wrapper.vm.$nextTick()
    jest.advanceTimersByTime(200)
    await flush()
  })

  afterEach(() => {
    if (wrapper) {
      const element = wrapper.element
      wrapper.destroy()
      if (element.parentNode) element.parentNode.removeChild(element)
    }
    if (transport) transport.restore()
    ElementUI.Message.closeAll()
    jest.clearAllTimers()
    jest.useRealTimers()
    if (savedUser === null) localStorage.removeItem('userId')
    else localStorage.setItem('userId', savedUser)
    if (savedRoles === null) localStorage.removeItem('roles')
    else localStorage.setItem('roles', savedRoles)
  })

  async function openAndFill(cpu, memory) {
    // The fixed operation column is the actual visible DBManage row action.
    const dropdown = wrapper.findAll({ name: 'ElDropdown' }).wrappers
      .find(item => item.element.closest('.el-table__fixed-right'))
    expect(dropdown).toBeDefined()
    dropdown.find('button').element.click()
    jest.advanceTimersByTime(300)
    await flush()
    await wrapper.vm.$nextTick()
    const menu = dropdown.vm.popperElm
    expect(menu).toBeTruthy()
    const change = Array.from(menu.querySelectorAll('li'))
      .find(item => item.textContent.trim() === '规格变更')
    expect(change).toBeDefined()
    expect(change.classList.contains('is-disabled')).toBe(false)
    change.click()
    await flush()
    await wrapper.vm.$nextTick()
    const dialog = wrapper.find(SpecDialog)
    expect(dialog.vm.modifySpecVisible).toBe(true)
    expect(dialog.props('instanceId')).toBe(instance.id)
    expect(dialog.props('specificationForm')).toEqual({ cpu: 2, memory: 4 })
    expect(transport.history.get.some(request => request.url === '/instances/instance-A')).toBe(true)
    const inputs = dialog.findAll('input')
    expect(inputs.length).toBe(2)
    await inputs.at(0).setValue(cpu)
    await inputs.at(1).setValue(memory)
    expect(errors).toEqual([])
    return dialog
  }

  async function clickConfirm(dialog) {
    const button = dialog.find('.el-dialog__footer button.el-button--primary')
    // Native DOM click honors the real ElementUI button's disabled property.
    // dispatchEvent/trigger would not be an adequate disabled-button oracle.
    button.element.click()
    await flush()
    await wrapper.vm.$nextTick()
    return button
  }

  it('sends one request when confirmation is clicked again during the pending request', async() => {
    const dialog = await openAndFill('4', '8')
    await clickConfirm(dialog)
    expect(transport.history.post).toHaveLength(1)
    expect(dialog.vm.isButtonLoading).toBe(true)
    await clickConfirm(dialog)
    expect(transport.history.post).toHaveLength(1)
    expect(transport.history.post[0].url).toBe(modifyUrl)
    expect(JSON.parse(transport.history.post[0].data)).toEqual({ cpu: '4', memory: '8' })
    expect(dialog.find('.el-dialog__footer button.el-button--primary').element.disabled).toBe(true)
    expect(errors).toEqual([])
  })

  it('keeps the existing numeric lower-bound validation before issuing requests', async() => {
    const dialog = await openAndFill('1', '8')
    await clickConfirm(dialog)
    expect(transport.history.post).toHaveLength(0)
    expect(dialog.find('.el-form-item__error').exists()).toBe(true)
    expect(dialog.vm.isButtonLoading).toBe(false)
    expect(errors).toEqual([])
  })

  it('allows a retry after the existing non-200 response branch releases loading', async() => {
    // Replace only the transport response plan, never component methods/state.
    responsePlan.push([500, { success: false, message: '暂时不可用' }])
    const dialog = await openAndFill('4', '8')
    await clickConfirm(dialog)
    expect(transport.history.post).toHaveLength(1)
    expect(dialog.vm.isButtonLoading).toBe(false)
    expect(dialog.find('.el-dialog__footer button.el-button--primary').element.disabled).toBe(false)
    await clickConfirm(dialog)
    expect(transport.history.post).toHaveLength(2)
    expect(JSON.parse(transport.history.post[1].data)).toEqual({ cpu: '4', memory: '8' })
    expect(errors).toEqual([])
  })

  it('preserves the backend-supported unchanged specification request', async() => {
    const dialog = await openAndFill('2', '4')
    await clickConfirm(dialog)
    expect(transport.history.post).toHaveLength(1)
    expect(JSON.parse(transport.history.post[0].data)).toEqual({ cpu: '2', memory: '4' })
    expect(dialog.find('.el-form-item__error').exists()).toBe(false)
    expect(errors).toEqual([])
  })
})
