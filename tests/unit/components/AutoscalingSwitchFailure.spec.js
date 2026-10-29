import { createLocalVue, mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import VueAxios from 'vue-axios'
import ElementUI from 'element-ui'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import AppMain from '@/layout/components/AppMain.vue'
import AutoscalingPage from '@/views/CloudNative/ExpansionAndContraction/index.vue'
import AutoscalingDetail from '@/views/CloudNative/ExpansionAndContraction/detail.vue'

async function flush() {
  for (let index = 0; index < 24; index++) await Promise.resolve()
}

const cluster = {
  clusterId: 'cluster-1', clusterName: 'Cluster A',
  serverUrl: '192.0.2.10', serverUser: 'operator', serverSshport: '22',
  configPath: '/home/operator/.kube/config'
}
const switchUrl = '/autoscaling/user-1/cluster-1'
const actionUrl = switchUrl + '/action'

describe('autoscaling switch errors keep their component receiver', () => {
  let wrapper
  let transport
  let actions
  let errors
  let savedUser
  let savedRoles

  beforeEach(() => {
    wrapper = null
    transport = null
    actions = []
    errors = []
    savedUser = localStorage.getItem('userId')
    savedRoles = localStorage.getItem('roles')
    localStorage.setItem('userId', 'user-1')
    localStorage.setItem('roles', JSON.stringify(['routine']))
  })

  afterEach(async() => {
    if (wrapper) {
      const element = wrapper.element
      wrapper.destroy()
      if (element.parentNode) element.parentNode.removeChild(element)
    }
    if (transport) transport.restore()
    ElementUI.Message.closeAll()
    await new Promise(resolve => setTimeout(resolve, 100)) // let Message own its leave teardown
    document.querySelectorAll('.el-message').forEach(element => {
      if (element.parentNode) element.parentNode.removeChild(element)
    })
    if (savedUser === null) localStorage.removeItem('userId')
    else localStorage.setItem('userId', savedUser)
    if (savedRoles === null) localStorage.removeItem('roles')
    else localStorage.setItem('roles', savedRoles)
  })

  async function settle() {
    await flush()
    await wrapper.vm.$nextTick()
    await flush()
  }

  async function openFromView(initial) {
    const localVue = createLocalVue()
    localVue.use(VueRouter)
    localVue.use(ElementUI)
    localVue.config.errorHandler = error => errors.push(error)
    const client = axios.create()
    // Same acceptance policy as main.js;503 is a real Axios rejection.
    client.defaults.validateStatus = status => status >= 200 && status <= 500
    localVue.use(VueAxios, client)
    transport = new MockAdapter(client)
    // Actual ClusterInfoVO/AutoScalingSwitchVO field shapes.
    transport.onGet('/clusters').reply(200, [cluster])
    transport.onGet(switchUrl).reply(200, {
      userId: 'user-1', clusterId: 'cluster-1', autoscalingSwitch: initial
    })
    transport.onGet(switchUrl + '/alert-rule').reply(200, [{
      id: 'rule-high', userId: 'user-1', clusterId: 'cluster-1',
      alertName: 'CPUHigh', type: 'CPU', conditionals: 'GT',
      threshold: 80, duration: 30
    }])
    // Only HTTP completion is controlled; the component handlers are untouched.
    transport.onPost(actionUrl).reply(config => new Promise(resolve => {
      actions.push({ url: config.url, data: JSON.parse(config.data), resolve })
    }))
    const router = new VueRouter({
      mode: 'abstract',
      routes: [
        { path: '/nativeCloud/ExpansionAndContraction/index', component: AutoscalingPage },
        { path: '/nativeCloud/ExpansionAndContraction/detail', component: AutoscalingDetail }
      ]
    })
    router.push('/nativeCloud/ExpansionAndContraction/index')
    wrapper = mount(AppMain, {
      localVue, router, sync: false, attachToDocument: true,
      stubs: { transition: false, 'transition-group': false }
    })
    await settle()
    const page = wrapper.find(AutoscalingPage)
    const view = page.find('.el-table__body-wrapper').findAll('tbody tr').at(0).find('button')
    expect(view.text()).toBe('查看')
    view.element.click() // actual viewBms -> GET -> real router.push
    await settle()
    await new Promise(resolve => setTimeout(resolve, 100)) // real AppMain CSS transition frames
    await settle()
    expect(router.currentRoute.path).toBe('/nativeCloud/ExpansionAndContraction/detail')
    expect(router.currentRoute.query.clusterId).toBe('cluster-1')
    expect(wrapper.find(AutoscalingDetail).exists()).toBe(true)
    expect(wrapper.find(AutoscalingDetail).find('.el-switch').classes('is-checked'))
      .toBe(initial === 'ON')
    expect(actions).toHaveLength(0)
    expect(errors).toEqual([])
  }

  async function toggle() {
    wrapper.find(AutoscalingDetail).find('.el-switch__core').element.click()
    await settle()
    return actions[actions.length - 1]
  }

  async function respond(request, status, body) {
    request.resolve([status, body])
    await settle()
  }

  function notices(type) {
    return document.querySelectorAll('.el-message--' + type).length
  }

  for (const initial of ['ON', 'OFF']) {
    const target = initial === 'ON' ? 'OFF' : 'ON'

    it(initial + ': reports an HTTP503 switch failure and can handle the next user switch', async() => {
      await openFromView(initial)
      const failed = await toggle()
      expect(failed.url).toBe(actionUrl)
      expect(failed.data).toEqual({ switchStatus: target })
      expect(actions).toHaveLength(1)
      await respond(failed, 503, { message: 'Service temporarily unavailable' })
      // Original unbound callback throws TypeError instead of reaching this
      // real ElementUI error notice. Do not suppress its promise rejection.
      expect(notices('error')).toBe(1)
      expect(notices('success')).toBe(0)
      expect(errors).toEqual([])
      // No new rollback policy: the next native toggle is the next UI value.
      const next = await toggle()
      expect(next.data).toEqual({ switchStatus: initial })
      await respond(next, 200, { code: 200, success: true })
      expect(actions).toHaveLength(2)
      expect(notices('success')).toBe(1)
      expect(errors).toEqual([])
    })

    it(initial + ': control retains the existing pending and successful switch behavior', async() => {
      await openFromView(initial)
      const current = await toggle()
      expect(current.data).toEqual({ switchStatus: target })
      expect(notices('success')).toBe(0)
      expect(notices('error')).toBe(0)
      await respond(current, 200, { code: 200, success: true })
      expect(notices('success')).toBe(1)
      expect(notices('error')).toBe(0)
      expect(actions).toHaveLength(1)
      expect(errors).toEqual([])
    })
  }
})
