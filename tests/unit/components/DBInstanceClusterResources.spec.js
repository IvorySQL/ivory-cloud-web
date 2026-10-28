import { createLocalVue, mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import ElementUI from 'element-ui'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import AppMain from '@/layout/components/AppMain.vue'
import DBInstance from '@/views/CloudNative/DBInstance/index.vue'

async function flush() {
  for (let index = 0; index < 24; index++) await Promise.resolve()
}

// Actual controllers return per-cluster List<Namespace>/List<StorageClass>
// from the selected cluster's real Kubernetes client. ObjectMeta.name is the
// field consumed by both existing ElementUI selects.
function resources(kind, clusterId) {
  const name = kind === 'namespace' ? 'ns-' + clusterId.toLowerCase() : 'storage-' + clusterId.toLowerCase()
  return [{ metadata: { uid: kind + '-' + clusterId, name }}]
}

describe('create-instance resource choices belong to the selected cluster', () => {
  let wrapper
  let transport
  let pending
  let deferResources
  let errors
  let message
  let savedDbtype
  let savedDbversion
  let savedForm
  let savedRestoreForm

  beforeEach(async() => {
    jest.useFakeTimers()
    savedDbtype = global.dbtype
    savedDbversion = global.dbversion
    // These values are the existing public/config.js application globals.
    global.dbtype = 'IvorySQL'
    global.dbversion = '5.6'
    savedForm = sessionStorage.getItem('form')
    savedRestoreForm = sessionStorage.getItem('restoreForm')
    sessionStorage.removeItem('form')
    sessionStorage.removeItem('restoreForm')
    const localVue = createLocalVue()
    localVue.use(VueRouter)
    localVue.use(ElementUI)
    errors = []
    localVue.config.errorHandler = error => errors.push(error)
    message = jest.fn()
    message.error = jest.fn()
    localVue.prototype.$message = message
    const client = axios.create()
    localVue.prototype.axios = client
    transport = new MockAdapter(client)
    transport.onGet('/clusters').reply(200, [
      { clusterId: 'A', clusterName: 'Cluster A' },
      { clusterId: 'B', clusterName: 'Cluster B' }
    ])
    pending = []
    deferResources = false
    const resourceResponse = (kind, clusterId) => {
      if (!deferResources) return [200, resources(kind, clusterId)]
      return new Promise(resolve => pending.push({ kind, clusterId, resolve, settled: false }))
    }
    transport.onGet(/^\/clusters\/[^/]+\/namespace$/).reply(config => {
      return resourceResponse('namespace', config.url.split('/')[2])
    })
    transport.onGet('/storage-class').reply(config => {
      return resourceResponse('storage', config.params.clusterId)
    })
    const router = new VueRouter({
      mode: 'abstract',
      routes: [{ path: '/nativeCloud/DBInstance/index', component: DBInstance }]
    })
    router.push('/nativeCloud/DBInstance/index')
    wrapper = mount(AppMain, {
      localVue,
      router,
      sync: false,
      attachToDocument: true,
      stubs: { 'svg-icon': true, transition: false, 'transition-group': false }
    })
    await flush()
    await wrapper.vm.$nextTick()
    expect(form().vm.form.clusterId).toBe('B')
    expectSelections('B')
    expect(errors).toEqual([])
    deferResources = true
  })

  afterEach(async() => {
    for (const request of pending) {
      if (!request.settled) {
        request.settled = true
        request.resolve([200, resources(request.kind, request.clusterId)])
      }
    }
    await flush()
    if (wrapper) {
      const element = wrapper.element
      wrapper.destroy()
      if (element.parentNode) element.parentNode.removeChild(element)
    }
    transport.restore()
    jest.clearAllTimers()
    jest.useRealTimers()
    if (savedDbtype === undefined) delete global.dbtype
    else global.dbtype = savedDbtype
    if (savedDbversion === undefined) delete global.dbversion
    else global.dbversion = savedDbversion
    if (savedForm == null) sessionStorage.removeItem('form')
    else sessionStorage.setItem('form', savedForm)
    if (savedRestoreForm == null) sessionStorage.removeItem('restoreForm')
    else sessionStorage.setItem('restoreForm', savedRestoreForm)
  })

  function form() {
    return wrapper.find(DBInstance)
  }

  function expectSelections(clusterId) {
    const component = form()
    const namespace = 'ns-' + clusterId.toLowerCase()
    const storage = 'storage-' + clusterId.toLowerCase()
    expect(component.vm.form.namespace).toBe(namespace)
    expect(component.vm.form.storageClass).toBe(storage)
    expect(component.vm.Namespace.map(item => item.metadata.name)).toEqual([namespace])
    expect(component.vm.StorageClass.map(item => item.metadata.name)).toEqual([storage])
    expect(component.find({ ref: 'namespace' }).find('input').element.value).toBe(namespace)
    expect(component.find({ ref: 'storageClass' }).find('input').element.value).toBe(storage)
  }

  async function choose(clusterId) {
    const before = pending.length
    await form().find({ ref: 'clusterName' }).find('input').trigger('click')
    await wrapper.vm.$nextTick()
    const option = [...document.querySelectorAll('.el-select-dropdown__item')]
      .find(element => element.textContent.trim() === 'Cluster ' + clusterId)
    expect(option).toBeDefined()
    option.click()
    await flush()
    await wrapper.vm.$nextTick()
    expect(form().vm.form.clusterId).toBe(clusterId)
    expect(pending.length).toBe(before + 2)
  }

  async function finish(clusterId, status = 200) {
    const requests = pending.filter(request => request.clusterId === clusterId && !request.settled)
    expect(requests).toHaveLength(2)
    for (const request of requests) {
      request.settled = true
      request.resolve([status, status === 200 ? resources(request.kind, clusterId) : {}])
    }
    await flush()
    await wrapper.vm.$nextTick()
  }

  it('clears the previous cluster options while new resource choices load', async() => {
    await choose('A')
    expect(form().vm.Namespace).toEqual([])
    expect(form().vm.StorageClass).toEqual([])
    expect(form().vm.form.namespace).toBe('')
    expect(form().vm.form.storageClass).toBe('')
    expect(form().find({ ref: 'namespace' }).find('input').element.value).toBe('')
    expect(form().find({ ref: 'storageClass' }).find('input').element.value).toBe('')
  })

  it('keeps B choices when older A requests complete after B', async() => {
    await choose('A')
    await choose('B')
    await finish('B')
    expectSelections('B')
    await finish('A')
    expectSelections('B')
    expect(message.error).not.toHaveBeenCalled()
    expect(errors).toEqual([])
  })

  it('ignores obsolete A failures instead of clearing the current B choices', async() => {
    await choose('A')
    await choose('B')
    await finish('B')
    await finish('A', 503)
    expectSelections('B')
    expect(message.error).not.toHaveBeenCalled()
    expect(errors).toEqual([])
  })

  it('accepts the current cluster resource responses normally', async() => {
    await choose('A')
    await finish('A')
    expectSelections('A')
    expect(message.error).not.toHaveBeenCalled()
  })

  it('continues clearing and reporting failures for the active selection', async() => {
    await choose('A')
    await finish('A', 503)
    expect(form().vm.Namespace).toEqual([])
    expect(form().vm.StorageClass).toEqual([])
    expect(form().vm.form.namespace).toBe('')
    expect(form().vm.form.storageClass).toBe('')
    expect(message.error).toHaveBeenCalledTimes(2)
    expect(errors).toEqual([])
  })
})
