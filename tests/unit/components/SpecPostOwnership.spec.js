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

describe('specification POST callbacks belong to the submitted dialog session', () => {
  let wrapper
  let localVue
  let transport
  let errors
  let message
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
    posts = []
    localVue.config.errorHandler = error => errors.push(error)
    const client = axios.create()
    // Match the real main.js response policy;503 is an Axios rejection.
    client.defaults.validateStatus = status => status >= 200 && status <= 500
    localVue.use(VueAxios, client)
    transport = new MockAdapter(client)
    transport.onGet('/instances/list/user-7').reply(200, rows)
    transport.onGet('/clusters').reply(200, [])
    rows.forEach(row => transport.onGet('/instances/' + row.id).reply(200, row))
    // Only actual HTTP boundaries are deferred; no backend job/DTO is implemented.
    transport.onPost(/^\/instances\/instance-[AB]\/action\/modify-spec$/)
      .reply(config => new Promise(resolve => posts.push({
        url: config.url,
        data: config.data,
        resolve,
        settled: false
      })))
    message = { success: jest.fn(), error: jest.fn() }
    localVue.prototype.$message = message
  })

  afterEach(async() => {
    posts.filter(request => !request.settled).forEach(request => {
      request.settled = true
      request.resolve([500, { success: false, message: 'cleanup' }])
    })
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
      const dropdown = wrapper.findAll({ name: 'ElDropdown' }).wrappers
        .filter(item => item.element.closest('.el-table__fixed-right'))[index]
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
      const row = wrapper.find('.el-table__fixed-right').findAll('tbody tr').at(index)
      expect(row.exists()).toBe(true)
      const button = row.find('button')
      expect(button.text().trim()).toBe('修改')
      expect(button.element.disabled).toBe(false)
      button.element.click()
    }
    await flush()
    await wrapper.vm.$nextTick()
    expect(dialog().vm.modifySpecVisible).toBe(true)
    expect(dialog().props('instanceId')).toBe(rows[index].id)
    expect(dialog().props('specificationForm')).toEqual({
      cpu: rows[index].cpu,
      memory: rows[index].memory
    })
  }

  async function submit(cpu, memory, id) {
    const before = posts.length
    const inputs = dialog().findAll('input')
    await inputs.at(0).setValue(cpu)
    await inputs.at(1).setValue(memory)
    const button = dialog().find('.el-dialog__footer button.el-button--primary')
    expect(button.element.disabled).toBe(false)
    button.element.click()
    await flush()
    await wrapper.vm.$nextTick()
    expect(posts).toHaveLength(before + 1)
    expect(posts[before].url).toBe('/instances/' + id + '/action/modify-spec')
    expect(JSON.parse(posts[before].data)).toEqual({ cpu, memory })
    expect(dialog().vm.isButtonLoading).toBe(true)
  }

  async function cancel() {
    const button = dialog().findAll('.el-dialog__footer button').at(1)
    expect(button.element.disabled).toBe(false)
    button.element.click()
    await flush()
    await wrapper.vm.$nextTick()
    jest.advanceTimersByTime(300)
    await flush()
    expect(dialog().vm.modifySpecVisible).toBe(false)
  }

  async function finish(index, status) {
    posts[index].settled = true
    posts[index].resolve([status, {
      success: status === 200,
      message: status === 200 ? 'accepted' : 'request unavailable'
    }])
    await flush()
    await wrapper.vm.$nextTick()
    jest.advanceTimersByTime(400)
    await flush()
  }

  const obsoleteResponses = [
    { kind: 'manage', nextRow: 1, status: 200 },
    { kind: 'specification', nextRow: 1, status: 500 },
    { kind: 'manage', nextRow: 0, status: 200 },
    { kind: 'specification', nextRow: 0, status: 503 }
  ]

  obsoleteResponses.forEach(({ kind, nextRow, status }) => {
    it(kind + ' keeps the reopened row ' + nextRow + ' pending after old HTTP ' + status, async() => {
      await openPage(kind)
      await openRow(0)
      await submit('4', '8', rows[0].id)
      await cancel()
      await openRow(nextRow)
      await submit('8', '16', rows[nextRow].id)
      const listReads = transport.history.get.filter(request =>
        request.url === '/instances/list/user-7').length

      await finish(0, status)

      expect(dialog().vm.modifySpecVisible).toBe(true)
      expect(dialog().props('instanceId')).toBe(rows[nextRow].id)
      expect(dialog().text()).toContain(rows[nextRow].name)
      expect(dialog().findAll('input').at(0).element.value).toBe('8')
      expect(dialog().findAll('input').at(1).element.value).toBe('16')
      expect(dialog().vm.isButtonLoading).toBe(true)
      expect(dialog().find('.el-dialog__footer button.el-button--primary').element.disabled).toBe(true)
      expect(message.success).not.toHaveBeenCalled()
      expect(message.error).not.toHaveBeenCalled()
      expect(transport.history.get.filter(request =>
        request.url === '/instances/list/user-7')).toHaveLength(listReads)
      expect(transport.history.post).toHaveLength(2)
      expect(errors).toEqual([])
    })
  })

  it('ignores a result after cancellation without reopening', async() => {
    await openPage('specification')
    await openRow(0)
    await submit('4', '8', rows[0].id)
    await cancel()
    await finish(0, 200)
    expect(dialog().vm.modifySpecVisible).toBe(false)
    expect(message.success).not.toHaveBeenCalled()
    expect(message.error).not.toHaveBeenCalled()
    expect(errors).toEqual([])
  })

  it('still accepts a success belonging to the current session', async() => {
    await openPage('manage')
    await openRow(1)
    await submit('8', '16', rows[1].id)
    const listReads = transport.history.get.filter(request =>
      request.url === '/instances/list/user-7').length
    await finish(0, 200)
    expect(dialog().vm.modifySpecVisible).toBe(false)
    expect(message.success).toHaveBeenCalledTimes(1)
    expect(message.error).not.toHaveBeenCalled()
    expect(transport.history.get.filter(request =>
      request.url === '/instances/list/user-7').length).toBeGreaterThan(listReads)
    expect(errors).toEqual([])
  })

  it('still reports a rejection belonging to the current session', async() => {
    await openPage('specification')
    await openRow(0)
    await submit('4', '8', rows[0].id)
    await finish(0, 503)
    expect(dialog().vm.modifySpecVisible).toBe(true)
    expect(dialog().vm.isButtonLoading).toBe(false)
    expect(message.error).toHaveBeenCalledTimes(1)
    expect(message.success).not.toHaveBeenCalled()
    expect(dialog().find('.el-dialog__footer button.el-button--primary').element.disabled).toBe(false)
    expect(errors).toEqual([])
  })
})

