import { createLocalVue, mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import VueAxios from 'vue-axios'
import ElementUI from 'element-ui'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import AppMain from '@/layout/components/AppMain.vue'
import SvgIcon from '@/components/SvgIcon/index.vue'
import DBManage from '@/views/CloudNative/DBManage/index.vue'
import SpecificationChange from '@/views/CloudNative/DBSpecificationChange/index.vue'
import SpecDialog from '@/components/Dialog/SpecDialog.vue'

async function flush() {
  for (let index = 0; index < 30; index++) await Promise.resolve()
}

function instance(id, cpu = 2, memory = 4) {
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
    cpu,
    memory,
    createdAt: '2026-10-29 08:00:00',
    network: [{ nodeIp: '192.0.2.10', nodePort: 30080 }]
  }
}

const rows = [instance('instance-A'), instance('instance-B', 4, 8)]
const paths = {
  manage: '/nativeCloud/DBManage/index',
  specification: '/nativeCloud/DBSpecificationChange/index'
}

describe('specification detail GET belongs to its open dialog session', () => {
  let wrapper
  let localVue
  let transport
  let errors
  let message
  let details
  let posts
  let pageKind
  let savedUser
  let savedRoles

  beforeEach(() => {
    jest.useFakeTimers()
    savedUser = localStorage.getItem('userId')
    savedRoles = localStorage.getItem('roles')
    localStorage.setItem('userId', 'user-7')
    localStorage.setItem('roles', JSON.stringify(['routine']))
    localVue = createLocalVue()
    localVue.use(VueRouter)
    localVue.use(ElementUI)
    localVue.component('svg-icon', SvgIcon)
    errors = []
    details = []
    posts = []
    localVue.config.errorHandler = error => errors.push(error)
    const client = axios.create()
    // Actual main.js accepts up to500;503 follows the genuine Axios rejection path.
    client.defaults.validateStatus = status => status >= 200 && status <= 500
    localVue.use(VueAxios, client)
    transport = new MockAdapter(client)
    transport.onGet('/instances/list/user-7').reply(200, rows)
    transport.onGet('/clusters').reply(200, [])
    transport.onGet(/^\/instances\/instance-[AB]$/).reply(config => new Promise(resolve => {
      details.push({ url: config.url, resolve, settled: false })
    }))
    transport.onPost(/^\/instances\/instance-[AB]\/action\/modify-spec$/)
      .reply(() => new Promise(resolve => posts.push(resolve)))
    message = { success: jest.fn(), error: jest.fn() }
    localVue.prototype.$message = message
  })

  afterEach(async() => {
    details.filter(request => !request.settled).forEach(request => {
      request.settled = true
      request.resolve([503, { message: 'cleanup' }])
    })
    posts.forEach(resolve => resolve([500, { message: 'cleanup' }]))
    await flush()
    if (wrapper) {
      const element = wrapper.element
      wrapper.destroy()
      if (element.parentNode) element.parentNode.removeChild(element)
    }
    wrapper = null
    transport.restore()
    ElementUI.Message.closeAll()
    jest.clearAllTimers()
    jest.useRealTimers()
    if (savedUser === null) localStorage.removeItem('userId')
    else localStorage.setItem('userId', savedUser)
    if (savedRoles === null) localStorage.removeItem('roles')
    else localStorage.setItem('roles', savedRoles)
  })

  async function openPage(kind) {
    pageKind = kind
    const router = new VueRouter({
      mode: 'abstract',
      routes: [
        { path: paths.manage, component: DBManage },
        { path: paths.specification, component: SpecificationChange }
      ]
    })
    await router.push(paths[kind])
    wrapper = mount(AppMain, {
      localVue,
      router,
      attachToDocument: true,
      sync: false,
      stubs: { transition: false, 'transition-group': false }
    })
    await flush()
    await wrapper.vm.$nextTick()
    jest.advanceTimersByTime(200)
    await flush()
  }

  function dialog() {
    return wrapper.find(SpecDialog)
  }

  async function openRow(index) {
    if (pageKind === 'manage') {
      const dropdowns = wrapper.findAll({ name: 'ElDropdown' }).wrappers
        .filter(item => item.element.closest('.el-table__fixed-right'))
      const dropdown = dropdowns[index]
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
    } else {
      const fixed = wrapper.find('.el-table__fixed-right')
      const row = fixed.findAll('tbody tr').at(index)
      expect(row.exists()).toBe(true)
      const button = row.find('button')
      expect(button.text().trim()).toBe('修改')
      expect(button.element.disabled).toBe(false)
      button.element.click()
    }
    await flush()
    await wrapper.vm.$nextTick()
    expect(dialog().vm.modifySpecVisible).toBe(true)
    expect(details[details.length - 1].url).toBe('/instances/' + rows[index].id)
  }

  async function closeDialog() {
    dialog().findAll('.el-dialog__footer button').at(1).element.click()
    await flush()
    await wrapper.vm.$nextTick()
    jest.advanceTimersByTime(300)
    await flush()
    expect(dialog().vm.modifySpecVisible).toBe(false)
  }

  async function completeDetail(index, cpu, memory) {
    const request = details[index]
    const original = rows.find(row => '/instances/' + row.id === request.url)
    request.settled = true
    request.resolve([200, { ...original, cpu, memory }])
    await flush()
    await wrapper.vm.$nextTick()
  }

  async function rejectDetail(index) {
    details[index].settled = true
    details[index].resolve([503, { message: 'detail unavailable' }])
    await flush()
    await wrapper.vm.$nextTick()
  }

  function expectCurrent(id, cpu, memory) {
    expect(dialog().props('instanceId')).toBe(id)
    expect(dialog().props('instanceName')).toBe('Database ' + id)
    expect(dialog().props('specificationForm')).toEqual({ cpu, memory })
    expect(dialog().text()).toContain('Database ' + id)
    expect(errors).toEqual([])
  }

  async function submitTo(id) {
    const inputs = dialog().findAll('input')
    await inputs.at(0).setValue('8')
    await inputs.at(1).setValue('16')
    dialog().find('.el-dialog__footer button.el-button--primary').element.click()
    await flush()
    await wrapper.vm.$nextTick()
    expect(transport.history.post).toHaveLength(1)
    expect(transport.history.post[0].url).toBe('/instances/' + id + '/action/modify-spec')
    expect(JSON.parse(transport.history.post[0].data)).toEqual({ cpu: '8', memory: '16' })
    expect(errors).toEqual([])
  }

  const entryKinds = ['manage', 'specification']
  entryKinds.forEach(kind => {
    it('keeps B selected after A detail finishes late through ' + kind, async() => {
      await openPage(kind)
      await openRow(0)
      await closeDialog()
      await openRow(1)
      await completeDetail(1, 4, 8)
      await completeDetail(0, 2, 4)
      expectCurrent('instance-B', 4, 8)
      await submitTo('instance-B')
      expect(message.error).not.toHaveBeenCalled()
    })
  })

  it('keeps the newer response when the same instance is closed and reopened', async() => {
    await openPage('specification')
    await openRow(0)
    await closeDialog()
    await openRow(0)
    await completeDetail(1, 4, 8)
    await completeDetail(0, 2, 4)
    expectCurrent('instance-A', 4, 8)
    expect(transport.history.post).toHaveLength(0)
  })

  it('does not repopulate a closed dialog from an old success', async() => {
    await openPage('specification')
    await openRow(0)
    await closeDialog()
    await completeDetail(0, 2, 4)
    expect(dialog().vm.modifySpecVisible).toBe(false)
    expect(dialog().props('instanceId')).toBe('')
    expect(dialog().props('specificationForm')).toEqual({ cpu: '', memory: '' })
    expect(transport.history.post).toHaveLength(0)
    expect(errors).toEqual([])
  })

  it('ignores old detail failure while the new instance stays active', async() => {
    await openPage('manage')
    await openRow(0)
    await closeDialog()
    await openRow(1)
    await completeDetail(1, 4, 8)
    await rejectDetail(0)
    expectCurrent('instance-B', 4, 8)
    expect(dialog().vm.modifySpecVisible).toBe(true)
    expect(message.error).not.toHaveBeenCalled()
  })

  it('loads and submits the current instance normally', async() => {
    await openPage('specification')
    await openRow(0)
    await completeDetail(0, 2, 4)
    expectCurrent('instance-A', 2, 4)
    await submitTo('instance-A')
    expect(message.error).not.toHaveBeenCalled()
  })

  it('still reports the current detail failure', async() => {
    await openPage('manage')
    await openRow(1)
    await rejectDetail(0)
    expect(message.error).toHaveBeenCalledTimes(1)
    expect(dialog().vm.modifySpecVisible).toBe(true)
    expect(transport.history.post).toHaveLength(0)
    expect(errors).toEqual([])
  })
})

