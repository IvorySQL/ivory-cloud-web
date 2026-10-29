import { createLocalVue, mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import VueAxios from 'vue-axios'
import ElementUI from 'element-ui'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import AppMain from '@/layout/components/AppMain.vue'
import SvgIcon from '@/components/SvgIcon/index.vue'
import DBExpansion from '@/views/CloudNative/DBExpansion/index.vue'
import ExpansionDialog from '@/components/Dialog/ExpansionDialog.vue'

const pagePath = '/nativeCloud/DBExpansion/index'
const rows = ['instance-A', 'instance-B'].map((id, index) => ({
  id,
  name: 'Database ' + id,
  clusterName: 'Cluster ' + id,
  namespace: 'default',
  status: 'RUNNING',
  version: '5.6',
  type: 'ALONE',
  storageClass: 'standard',
  storage: index === 0 ? 20 : 30,
  cpu: 2,
  memory: 4,
  createdAt: '2026-10-29 08:00:00',
  network: [{ nodeIp: '192.0.2.10', nodePort: 30080 }]
}))

async function settle(milliseconds = 100) {
  for (let index = 0; index < 24; index++) await Promise.resolve()
  await new Promise(resolve => setTimeout(resolve, milliseconds))
  for (let index = 0; index < 24; index++) await Promise.resolve()
}

describe('disk expansion POST callbacks belong to their visible opening', () => {
  let wrapper
  let transport
  let posts
  let errors
  let savedUser
  let savedRoles

  beforeEach(async() => {
    posts = []
    errors = []
    wrapper = null
    savedUser = localStorage.getItem('userId')
    savedRoles = localStorage.getItem('roles')
    localStorage.setItem('userId', 'user-7')
    localStorage.setItem('roles', JSON.stringify(['routine']))
    const localVue = createLocalVue()
    localVue.use(VueRouter)
    localVue.use(ElementUI)
    localVue.component('svg-icon', SvgIcon)
    localVue.config.errorHandler = error => errors.push(error)
    const client = axios.create()
    // Genuine main.js policy:500 resolves,503 rejects.
    client.defaults.validateStatus = status => status >= 200 && status <= 500
    localVue.use(VueAxios, client)
    transport = new MockAdapter(client)
    transport.onGet('/instances/list/user-7').reply(200, rows)
    transport.onGet('/clusters').reply(200, [])
    rows.forEach(row => transport.onGet('/instances/' + row.id).reply(200, row))
    transport.onPost(/^\/instances\/instance-[AB]\/action\/storage$/)
      .reply(config => new Promise(resolve => posts.push({
        url: config.url,
        data: config.data,
        resolve,
        settled: false
      })))
    const router = new VueRouter({
      mode: 'abstract',
      routes: [{ path: pagePath, component: DBExpansion }]
    })
    await router.push(pagePath)
    wrapper = mount(AppMain, {
      localVue,
      router,
      attachToDocument: true,
      sync: false,
      stubs: { transition: false, 'transition-group': false }
    })
    // Actual MainTable releases its initial overlay after150ms.
    await settle(200)
    expect(wrapper.find(DBExpansion).exists()).toBe(true)
    expect(errors).toEqual([])
  })

  afterEach(async() => {
    posts.filter(request => !request.settled).forEach(request => {
      request.settled = true
      request.resolve([500, { message: 'cleanup' }])
    })
    await settle()
    ElementUI.Message.closeAll()
    // Keep Message nodes through the real CSS leave lifecycle, no body wipe.
    await settle(400)
    if (wrapper) {
      const element = wrapper.element
      wrapper.destroy()
      if (element.parentNode) element.parentNode.removeChild(element)
    }
    wrapper = null
    transport.restore()
    if (savedUser === null) localStorage.removeItem('userId')
    else localStorage.setItem('userId', savedUser)
    if (savedRoles === null) localStorage.removeItem('roles')
    else localStorage.setItem('roles', savedRoles)
  })

  function dialog() {
    return wrapper.find(ExpansionDialog)
  }

  async function openRow(index) {
    const row = wrapper.find('.el-table__fixed-right').findAll('tbody tr').at(index)
    expect(row.exists()).toBe(true)
    const button = row.find('button')
    expect(button.text().trim()).toBe('修改')
    expect(button.element.disabled).toBe(false)
    button.element.click()
    await settle()
    expect(dialog().vm.storageExpansionVisible).toBe(true)
    expect(dialog().props('instanceId')).toBe(rows[index].id)
    expect(dialog().props('storageForm').storage).toBe(rows[index].storage)
  }

  async function submit(size, id) {
    const count = posts.length
    await dialog().find('input').setValue(size)
    const button = dialog().find('.el-dialog__footer button.el-button--primary')
    expect(button.element.disabled).toBe(false)
    button.element.click()
    await settle()
    expect(posts).toHaveLength(count + 1)
    expect(posts[count].url).toBe('/instances/' + id + '/action/storage')
    expect(JSON.parse(posts[count].data)).toEqual({ storageSize: size })
    expect(dialog().vm.isButtonLoading).toBe(true)
  }

  async function cancel() {
    const button = dialog().findAll('.el-dialog__footer button').at(1)
    expect(button.element.disabled).toBe(false)
    button.element.click()
    await settle(400)
    expect(dialog().vm.storageExpansionVisible).toBe(false)
  }

  async function finish(index, status) {
    posts[index].settled = true
    posts[index].resolve([status, {
      success: status === 200,
      message: status === 200 ? 'accepted' : 'request unavailable'
    }])
    // Includes actual300ms successful list-refresh timer.
    await settle(400)
  }

  function listReadCount() {
    return transport.history.get.filter(request => request.url === '/instances/list/user-7').length
  }

  for (const { nextRow, status } of [
    { nextRow: 1, status: 200 },
    { nextRow: 0, status: 200 },
    { nextRow: 1, status: 500 },
    { nextRow: 0, status: 503 }
  ]) {
    it('preserves reopened row ' + nextRow + ' pending after obsolete HTTP ' + status, async() => {
      await openRow(0)
      await submit('40', rows[0].id)
      await cancel()
      await openRow(nextRow)
      await submit('60', rows[nextRow].id)
      const reads = listReadCount()
      await finish(0, status)
      expect(dialog().vm.storageExpansionVisible).toBe(true)
      expect(dialog().props('instanceId')).toBe(rows[nextRow].id)
      expect(dialog().text()).toContain(rows[nextRow].name)
      expect(dialog().find('input').element.value).toBe('60')
      expect(dialog().vm.isButtonLoading).toBe(true)
      expect(dialog().find('.el-dialog__footer button.el-button--primary').element.disabled).toBe(true)
      expect(listReadCount()).toBe(reads)
      expect(transport.history.post).toHaveLength(2)
      expect(document.querySelectorAll('.el-message')).toHaveLength(0)
      expect(errors).toEqual([])
    })
  }

  it('does not report success after the submitted opening was cancelled', async() => {
    await openRow(0)
    await submit('40', rows[0].id)
    await cancel()
    const reads = listReadCount()
    await finish(0, 200)
    expect(dialog().vm.storageExpansionVisible).toBe(false)
    expect(listReadCount()).toBe(reads)
    expect(document.querySelectorAll('.el-message')).toHaveLength(0)
    expect(errors).toEqual([])
  })

  it('still closes and refreshes on the current request success', async() => {
    await openRow(1)
    await submit('60', rows[1].id)
    const reads = listReadCount()
    await finish(0, 200)
    expect(dialog().vm.storageExpansionVisible).toBe(false)
    expect(listReadCount()).toBeGreaterThan(reads)
    expect(document.querySelectorAll('.el-message--success')).toHaveLength(1)
    expect(errors).toEqual([])
  })

  it('still releases the current rejection and allows a genuine retry', async() => {
    await openRow(0)
    await submit('40', rows[0].id)
    await finish(0, 503)
    expect(dialog().vm.storageExpansionVisible).toBe(true)
    expect(dialog().vm.isButtonLoading).toBe(false)
    expect(document.querySelectorAll('.el-message--error')).toHaveLength(1)
    await submit('60', rows[0].id)
    expect(transport.history.post).toHaveLength(2)
    expect(errors).toEqual([])
  })
})
