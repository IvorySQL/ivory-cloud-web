import { createLocalVue, mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import VueAxios from 'vue-axios'
import ElementUI from 'element-ui'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import AppMain from '@/layout/components/AppMain.vue'
import ParameterPage from '@/views/CloudNative/ParameterModuleManage/index.vue'
import DBManage from '@/views/CloudNative/DBManage/index.vue'
import MainTable from '@/components/MainTable/index.vue'
import ParamDialog from '@/components/Dialog/ParamDialog.vue'
import SvgIcon from '@/components/SvgIcon/index.vue'

async function flush() {
  for (let index = 0; index < 24; index++) await Promise.resolve()
}

// Existing backend seed and ConfigParamInfoVO contract, not alternate rules.
function parameters(id) {
  return [
    {
      name: 'work_mem', paramType: 'VARCHAR', defaultValue: '4MB',
      runningValue: id === 'instance-A' ? '4MB' : '16MB',
      min: '1', max: '2048', enumValue: null, rule: '^[1-9]\\d*(MB){1}$',
      description: '设置查询操作可使用的最大内存容量，改变该参数不需要重启。'
    },
    {
      name: 'max_parallel_workers', paramType: 'INTEGER', defaultValue: '8',
      runningValue: '8', min: '0', max: '1024', enumValue: null, rule: null,
      description: '设置系统为并行操作所支持的工作者的最大数量。'
    }
  ]
}

const instances = ['A', 'B'].map(letter => ({
  id: 'instance-' + letter, name: 'Database ' + letter,
  clusterName: 'Cluster A', namespace: 'default', status: 'RUNNING',
  version: '5.6', type: 'ALONE', storageClass: 'standard', storage: 20,
  cpu: 2, memory: 4, network: [{ nodeIp: '192.0.2.10', nodePort: 30080 }]
}))

describe('parameter requests retain their actual dialog session', () => {
  let wrapper
  let transport
  let errors
  let gets
  let puts
  let savedUser
  let savedRoles
  let routeKind

  beforeEach(() => {
    jest.useFakeTimers()
    wrapper = null
    transport = null
    errors = []
    gets = []
    puts = []
    savedUser = localStorage.getItem('userId')
    savedRoles = localStorage.getItem('roles')
    localStorage.setItem('userId', 'user-7')
    localStorage.setItem('roles', JSON.stringify(['routine']))
  })

  afterEach(() => {
    if (wrapper) {
      const element = wrapper.element
      wrapper.destroy()
      if (element.parentNode) element.parentNode.removeChild(element)
    }
    if (transport) transport.restore()
    ElementUI.Message.closeAll()
    // ElementUI message leave transitions do not remove nodes in JSDOM.
    document.querySelectorAll('.el-message').forEach(element => {
      if (element.parentNode) element.parentNode.removeChild(element)
    })
    jest.clearAllTimers()
    jest.useRealTimers()
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

  async function start(kind = 'parameters') {
    routeKind = kind
    const localVue = createLocalVue()
    localVue.use(VueRouter)
    localVue.use(ElementUI)
    localVue.component('svg-icon', SvgIcon)
    localVue.config.errorHandler = error => errors.push(error)
    const client = axios.create()
    // The actual application accepts status200..500; use503 for catch paths.
    client.defaults.validateStatus = status => status >= 200 && status <= 500
    localVue.use(VueAxios, client)
    transport = new MockAdapter(client)
    transport.onGet('/instances/list/user-7').reply(200, instances)
    transport.onGet('/clusters').reply(200, [])
    const parameterUrl = /^\/instances\/instance-[AB]\/parameters$/
    transport.onGet(parameterUrl).reply(config => new Promise(resolve => {
      gets.push({ url: config.url, resolve })
    }))
    transport.onPut(parameterUrl).reply(config => new Promise(resolve => {
      puts.push({ url: config.url, data: JSON.parse(config.data), resolve })
    }))
    const route = kind === 'parameters'
      ? '/nativeCloud/ParameterModuleManage/index'
      : '/nativeCloud/DBManage/index'
    const router = new VueRouter({
      mode: 'abstract',
      routes: [{ path: route, component: kind === 'parameters' ? ParameterPage : DBManage }]
    })
    router.push(route)
    wrapper = mount(AppMain, {
      localVue, router, sync: false, attachToDocument: true,
      stubs: { transition: false, 'transition-group': false }
    })
    await settle()
    jest.advanceTimersByTime(200)
    await settle()
    expect(wrapper.find(MainTable).exists()).toBe(true)
    expect(errors).toEqual([])
  }

  function dialog() {
    return wrapper.find(ParamDialog)
  }

  function parameterRows() {
    return dialog().find('.el-table__body-wrapper').findAll('tbody tr')
  }

  async function open(id) {
    const index = id === 'instance-A' ? 0 : 1
    const table = wrapper.find(MainTable)
    if (routeKind === 'parameters') {
      table.find('.el-table__fixed-right').findAll('tbody tr').at(index).find('button').element.click()
    } else {
      const dropdown = table.findAll({ name: 'ElDropdown' }).wrappers
        .filter(item => item.element.closest('.el-table__fixed-right'))[index]
      expect(dropdown).toBeDefined()
      dropdown.find('button').element.click()
      jest.advanceTimersByTime(300)
      await settle()
      const item = Array.from(dropdown.vm.popperElm.querySelectorAll('li'))
        .find(element => element.textContent.trim() === '参数管理')
      expect(item).toBeDefined()
      expect(item.classList.contains('is-disabled')).toBe(false)
      item.click()
    }
    await settle()
    expect(dialog().vm.modifyParamsVisible).toBe(true)
    expect(gets[gets.length - 1].url).toBe('/instances/' + id + '/parameters')
    return gets[gets.length - 1]
  }

  async function respond(request, status, body) {
    request.resolve([status, body])
    await settle()
  }

  async function load(id) {
    const request = await open(id)
    await respond(request, 200, parameters(id))
    expect(dialog().props('instanceId')).toBe(id)
    expect(parameterRows().length).toBe(2)
    return request
  }

  async function cancel() {
    const buttons = dialog().find('.el-dialog__footer').findAll('button')
    expect(buttons.at(1).text()).toBe('取 消')
    buttons.at(1).element.click()
    await settle()
    expect(dialog().vm.modifyParamsVisible).toBe(false)
    jest.advanceTimersByTime(350)
    await settle()
  }

  async function editWorkMem(value, save = true) {
    const button = dialog().find('.el-table__fixed-right').findAll('tbody tr').at(0).find('button')
    expect(button.text()).toBe('编辑')
    button.element.click()
    await settle()
    await parameterRows().at(0).find('input').setValue(value)
    await settle()
    if (save) {
      const saveButton = dialog().find('.el-table__fixed-right').findAll('tbody tr').at(0).find('button')
      expect(saveButton.text()).toBe('保存')
      saveButton.element.click()
      await settle()
      expect(parameterRows().at(0).find('input').exists()).toBe(false)
    }
    expect(errors).toEqual([])
  }

  async function confirm() {
    dialog().find('.el-dialog__footer button.el-button--primary').element.click()
    await settle()
    expect(errors).toEqual([])
    return puts[puts.length - 1]
  }

  function expectOwnedBy(id) {
    expect(dialog().vm.modifyParamsVisible).toBe(true)
    expect(dialog().props('instanceId')).toBe(id)
    expect(parameterRows().length).toBe(2)
  }

  function notices(type) {
    return document.querySelectorAll('.el-message--' + type).length
  }

  for (const kind of ['parameters', 'manage']) {
    it(kind + ': an old PUT success cannot close the reopened B editor', async() => {
      await start(kind)
      await load('instance-A')
      await editWorkMem('8MB')
      const old = await confirm()
      expect(old.data).toEqual({ description: '', params: [{ paramName: 'work_mem', targetValue: '8MB' }] })
      await cancel()
      await load('instance-B')
      await editWorkMem('32MB', false)
      await respond(old, 200, { success: true, message: '下发成功' })
      expectOwnedBy('instance-B')
      expect(parameterRows().at(0).find('input').element.value).toBe('32MB')
      expect(notices('success')).toBe(0)
    })

    it(kind + ': an old GET success cannot replace B rows or selected instance', async() => {
      await start(kind)
      const old = await open('instance-A')
      await cancel()
      await load('instance-B')
      await editWorkMem('32MB')
      await respond(old, 200, parameters('instance-A'))
      expectOwnedBy('instance-B')
      expect(parameterRows().at(0).text()).toContain('32MB')
      const current = await confirm()
      expect(current.url).toBe('/instances/instance-B/parameters')
      expect(current.data).toEqual({ description: '', params: [{ paramName: 'work_mem', targetValue: '32MB' }] })
    })
  }

  it('ignores an old non-200 PUT while B has a saved pending request', async() => {
    await start()
    await load('instance-A')
    await editWorkMem('8MB')
    const old = await confirm()
    await cancel()
    await load('instance-B')
    await editWorkMem('32MB')
    const current = await confirm()
    await respond(old, 500, { success: false, message: 'old instance A failed' })
    expectOwnedBy('instance-B')
    expect(notices('error')).toBe(0)
    expect(current.url).toBe('/instances/instance-B/parameters')
    expect(puts.length).toBe(2)
  })

  it('ignores an old rejected PUT while the reopened B editor is unsaved', async() => {
    await start()
    await load('instance-A')
    await editWorkMem('8MB')
    const old = await confirm()
    await cancel()
    await load('instance-B')
    await editWorkMem('32MB', false)
    await respond(old, 503, { message: 'old unavailable' })
    expectOwnedBy('instance-B')
    expect(parameterRows().at(0).find('input').element.value).toBe('32MB')
    expect(notices('error')).toBe(0)
  })

  it('also distinguishes cancel/reopen sessions for the same instance ID', async() => {
    await start()
    await load('instance-A')
    await editWorkMem('8MB')
    const old = await confirm()
    await cancel()
    await load('instance-A')
    await editWorkMem('32MB', false)
    await respond(old, 200, { success: true })
    expectOwnedBy('instance-A')
    expect(parameterRows().at(0).find('input').element.value).toBe('32MB')
    expect(notices('success')).toBe(0)
  })

  it('ignores an old GET rejection after cancel/reopen has loaded B', async() => {
    await start()
    const old = await open('instance-A')
    await cancel()
    await load('instance-B')
    await respond(old, 503, { message: 'old unavailable' })
    expectOwnedBy('instance-B')
    expect(notices('error')).toBe(0)
  })

  it('control: a current GET rejection still reports its actual HTTP failure', async() => {
    await start()
    const current = await open('instance-A')
    await respond(current, 503, { message: 'current unavailable' })
    expect(dialog().vm.modifyParamsVisible).toBe(true)
    expect(notices('error')).toBe(1)
    expect(errors).toEqual([])
  })

  it('control: a current failed PUT can be edited, saved and retried successfully', async() => {
    await start()
    await load('instance-A')
    await editWorkMem('8MB')
    const first = await confirm()
    await respond(first, 500, { success: false, message: 'current rejected' })
    expectOwnedBy('instance-A')
    expect(notices('error')).toBe(1)
    await editWorkMem('16MB')
    const retry = await confirm()
    expect(retry.data).toEqual({ description: '', params: [{ paramName: 'work_mem', targetValue: '16MB' }] })
    await respond(retry, 200, { success: true, message: '下发成功' })
    expect(dialog().vm.modifyParamsVisible).toBe(false)
    expect(notices('success')).toBe(1)
    expect(puts.length).toBe(2)
    expect(errors).toEqual([])
  })
})
