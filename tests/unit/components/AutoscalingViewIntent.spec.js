import { createLocalVue, mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import VueAxios from 'vue-axios'
import ElementUI from 'element-ui'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import AppMain from '@/layout/components/AppMain.vue'
import Index from '@/views/CloudNative/ExpansionAndContraction/index.vue'
import Detail from '@/views/CloudNative/ExpansionAndContraction/detail.vue'

const listPath = '/nativeCloud/ExpansionAndContraction/index'
const detailPath = '/nativeCloud/ExpansionAndContraction/detail'
const clusters = ['cluster-A', 'cluster-B'].map((clusterId, index) => ({
  clusterId,
  clusterName: 'Cluster ' + clusterId,
  serverUrl: '192.0.2.' + (index + 10),
  serverUser: 'operator',
  serverSshport: '22',
  configPath: '/home/operator/.kube/config'
}))

async function settle() {
  for (let index = 0; index < 24; index++) await Promise.resolve()
  await new Promise(resolve => setTimeout(resolve, 100))
  for (let index = 0; index < 24; index++) await Promise.resolve()
}

describe('autoscaling View navigation follows the latest real row click', () => {
  let wrapper
  let router
  let transport
  let pending
  let errors
  let savedUser
  let savedRoles

  beforeEach(() => {
    wrapper = null
    transport = null
    pending = []
    errors = []
    savedUser = localStorage.getItem('userId')
    savedRoles = localStorage.getItem('roles')
    localStorage.setItem('userId', 'user-7')
    localStorage.setItem('roles', JSON.stringify(['routine']))
    ElementUI.Message.closeAll()
  })

  afterEach(async() => {
    pending.filter(request => !request.settled).forEach(request => {
      request.settled = true
      request.resolve([503, { message: 'cleanup' }])
    })
    await settle()
    if (wrapper) {
      const element = wrapper.element
      wrapper.destroy()
      if (element.parentNode) element.parentNode.removeChild(element)
    }
    wrapper = null
    if (transport) transport.restore()
    ElementUI.Message.closeAll()
    await settle()
    if (savedUser === null) localStorage.removeItem('userId')
    else localStorage.setItem('userId', savedUser)
    if (savedRoles === null) localStorage.removeItem('roles')
    else localStorage.setItem('roles', savedRoles)
  })

  async function openListAndClickBothViews() {
    const localVue = createLocalVue()
    localVue.use(VueRouter)
    localVue.use(ElementUI)
    localVue.config.errorHandler = error => errors.push(error)
    const client = axios.create()
    client.defaults.validateStatus = status => status >= 200 && status <= 500
    localVue.use(VueAxios, client)
    transport = new MockAdapter(client)
    transport.onGet('/clusters').reply(200, clusters)
    clusters.forEach(({ clusterId }) => {
      const stateUrl = '/autoscaling/user-7/' + clusterId
      const state = { autoscalingSwitch: clusterId === 'cluster-B' ? 'ON' : 'OFF' }
      let stateReads = 0
      transport.onGet(stateUrl).reply(config => {
        // First GET is the actual View preflight. Any later GET is issued by
        // the mounted REAL detail consumer, never by a test helper/router push.
        if (stateReads++ === 0) {
          return new Promise(resolve => pending.push({
            clusterId,
            url: config.url,
            resolve,
            settled: false
          }))
        }
        return [200, state]
      })
      transport.onGet(stateUrl + '/alert-rule').reply(200, [{
        id: 'rule-' + clusterId,
        alertName: 'Rule for ' + clusterId,
        type: 'CPU',
        conditionals: 'GT',
        threshold: 80,
        duration: 30
      }])
    })
    router = new VueRouter({
      mode: 'abstract',
      routes: [
        { path: listPath, component: Index },
        { path: detailPath, component: Detail }
      ]
    })
    // Initial list setup only. Every subsequent navigation must come from
    // actual viewBms callbacks, triggered by the two native View button clicks.
    await router.push(listPath)
    wrapper = mount(AppMain, {
      localVue,
      router,
      attachToDocument: true,
      sync: false,
      stubs: { transition: false, 'transition-group': false }
    })
    await settle()
    const page = wrapper.find(Index)
    const rows = page.find('.el-table__body-wrapper').findAll('tbody tr')
    expect(rows.length).toBe(2)
    for (const index of [0, 1]) {
      const button = rows.at(index).findAll('button').wrappers
        .find(item => item.text().trim() === '查看')
      expect(button).toBeDefined()
      expect(button.element.disabled).toBe(false)
      button.element.click()
      await settle()
      expect(wrapper.find(Index).exists()).toBe(true)
    }
    expect(pending.map(request => request.clusterId)).toEqual(['cluster-A', 'cluster-B'])
    expect(router.currentRoute.path).toBe(listPath)
    expect(page.vm.listLoading).toBe(false)
    expect(errors).toEqual([])
  }

  async function finishView(index, status = 200) {
    pending[index].settled = true
    pending[index].resolve([status, status === 200
      ? { autoscalingSwitch: index === 1 ? 'ON' : 'OFF' }
      : { message: 'View unavailable' }])
    await settle()
    await settle()
  }

  function expectLatestDetail() {
    expect(router.currentRoute.path).toBe(detailPath)
    expect(router.currentRoute.query.clusterId).toBe('cluster-B')
    const detail = wrapper.find(Detail)
    expect(detail.exists()).toBe(true)
    expect(detail.vm.clusterId).toBe('cluster-B')
    expect(detail.find('.el-table__body-wrapper').text()).toContain('Rule for cluster-B')
    expect(detail.find('.el-table__body-wrapper').text()).not.toContain('Rule for cluster-A')
    expect(detail.find('.el-switch').classes('is-checked')).toBe(true)
    expect(errors).toEqual([])
  }

  function expectNoNotifications() {
    expect(document.querySelectorAll('.el-message--warning')).toHaveLength(0)
    expect(document.querySelectorAll('.el-message--error')).toHaveLength(0)
  }

  it('does not mount A while the newer B intent is pending, even if A finishes first', async() => {
    await openListAndClickBothViews()
    await finishView(0)
    await finishView(1)
    // Baseline may end with query B but retain the mounted A detail data,
    // because AppMain key is route.path and the detail only reads query at mount.
    expectLatestDetail()
    expectNoNotifications()
  })

  it('does not let late A overwrite B after B has already opened', async() => {
    await openListAndClickBothViews()
    await finishView(1)
    await finishView(0)
    expectLatestDetail()
    expectNoNotifications()
  })

  for (const status of [500, 503]) {
    it('ignores obsolete A HTTP ' + status + ' after the latest B opens', async() => {
      await openListAndClickBothViews()
      await finishView(1)
      await finishView(0, status)
      expectLatestDetail()
      expectNoNotifications()
    })
  }

  it('opens B normally when only the latest requested View has completed', async() => {
    await openListAndClickBothViews()
    await finishView(1)
    expectLatestDetail()
    expectNoNotifications()
  })

  it('still reports failure of the latest B request without inventing a navigation', async() => {
    await openListAndClickBothViews()
    await finishView(1, 503)
    expect(router.currentRoute.path).toBe(listPath)
    expect(wrapper.find(Index).exists()).toBe(true)
    expect(wrapper.find(Detail).exists()).toBe(false)
    expect(document.querySelectorAll('.el-message--error')).toHaveLength(1)
    expect(document.querySelectorAll('.el-message--warning')).toHaveLength(0)
    expect(errors).toEqual([])
  })
})

