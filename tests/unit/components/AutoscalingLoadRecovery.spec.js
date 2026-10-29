import { createLocalVue, mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import VueAxios from 'vue-axios'
import ElementUI from 'element-ui'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import AppMain from '@/layout/components/AppMain.vue'
import Index from '@/views/CloudNative/ExpansionAndContraction/index.vue'
import Detail from '@/views/CloudNative/ExpansionAndContraction/detail.vue'
const statusUrl = '/autoscaling/user-1/cluster-1'
const rulesUrl = statusUrl + '/alert-rule'
async function settle() {
  for (let i = 0; i < 24; i++) await Promise.resolve()
  await new Promise(resolve => setTimeout(resolve, 100))
  for (let i = 0; i < 24; i++) await Promise.resolve()
}
describe('autoscaling load recovery via real cluster navigation', () => {
  let wrapper, adapter, pending, errors, savedUser, savedRoles
  beforeEach(() => {
    wrapper = null
    adapter = null
    pending = []
    errors = []
    savedUser = localStorage.getItem('userId')
    savedRoles = localStorage.getItem('roles')
    localStorage.setItem('userId', 'user-1')
    localStorage.setItem('roles', JSON.stringify(['routine']))
  })
  afterEach(async() => {
    if (wrapper) { const el = wrapper.element; wrapper.destroy(); if (el.parentNode) el.parentNode.removeChild(el) }
    if (adapter) adapter.restore()
    ElementUI.Message.closeAll()
    await settle()
    if (savedUser === null) localStorage.removeItem('userId')
    else localStorage.setItem('userId', savedUser)
    if (savedRoles === null) localStorage.removeItem('roles')
    else localStorage.setItem('roles', savedRoles)
  })
  function loading() {
    return wrapper.find(Detail).findAll('.el-loading-mask').wrappers.some(el => el.element.style.display !== 'none')
  }
  async function open() {
    const vue = createLocalVue()
    vue.use(VueRouter)
    vue.use(ElementUI)
    vue.config.errorHandler = error => errors.push(error)
    const client = axios.create()
    client.defaults.validateStatus = status => status >= 200 && status <= 500
    vue.use(VueAxios, client)
    adapter = new MockAdapter(client)
    adapter.onGet('/clusters').reply(200, [{ clusterId: 'cluster-1', clusterName: 'Cluster A', serverUrl: '192.0.2.10', serverUser: 'operator', serverSshport: '22', configPath: '/home/operator/.kube/config' }])
    let count = 0
    adapter.onGet(statusUrl).reply(config => {
      if (count++ === 0) return [200, { autoscalingSwitch: 'ON' }]
      return new Promise(resolve => pending.push({ url: config.url, resolve }))
    })
    adapter.onGet(rulesUrl).reply(config => new Promise(resolve => pending.push({ url: config.url, resolve })))
    const router = new VueRouter({ mode: 'abstract', routes: [
      { path: '/nativeCloud/ExpansionAndContraction/index', component: Index },
      { path: '/nativeCloud/ExpansionAndContraction/detail', component: Detail }
    ] })
    router.push('/nativeCloud/ExpansionAndContraction/index')
    wrapper = mount(AppMain, { localVue: vue, router, sync: false, attachToDocument: true, stubs: { transition: false, 'transition-group': false }})
    await settle()
    const view = wrapper.find(Index).find('.el-table__body-wrapper').find('tbody tr').find('button')
    expect(view.text()).toBe('查看')
    view.element.click()
    await settle()
    await settle()
    expect(router.currentRoute.query.clusterId).toBe('cluster-1')
    expect(wrapper.find(Detail).exists()).toBe(true)
    expect(pending).toHaveLength(1)
    expect(pending[0].url).toBe(statusUrl)
    expect(loading()).toBe(true)
  }
  async function reply(item, status, body) { item.resolve([status, body]); await settle() }
  for (const stage of ['status', 'rules']) {
    it(stage + ' HTTP503 releases actual loading overlay and reports error', async() => {
      await open()
      if (stage === 'rules') {
        await reply(pending[0], 200, { autoscalingSwitch: 'ON' })
        expect(pending[1].url).toBe(rulesUrl)
        expect(loading()).toBe(true)
      }
      await reply(pending[stage === 'status' ? 0 : 1], 503, { message: 'Temporarily unavailable' })
      expect(loading()).toBe(false)
      expect(document.querySelectorAll('.el-message--error')).toHaveLength(1)
      expect(document.querySelectorAll('.el-message--success')).toHaveLength(0)
      expect(pending).toHaveLength(stage === 'status' ? 1 : 2)
      expect(errors).toEqual([])
    })
  }
  for (const status of ['ON', 'OFF']) {
    it(status + ' control waits for real rules response and displays returned row', async() => {
      await open()
      await reply(pending[0], 200, { autoscalingSwitch: status })
      expect(pending[1].url).toBe(rulesUrl)
      expect(loading()).toBe(true)
      await reply(pending[1], 200, [{ id: 'rule-1', alertName: 'CPUHigh', type: 'CPU', conditionals: 'GT', threshold: 80, duration: 30 }])
      expect(loading()).toBe(false)
      expect(wrapper.find(Detail).find('.el-table__body-wrapper').text()).toContain('CPUHigh')
      expect(wrapper.find(Detail).find('.el-switch').classes('is-checked')).toBe(status === 'ON')
      expect(document.querySelectorAll('.el-message--error')).toHaveLength(0)
      expect(errors).toEqual([])
    })
  }
})
