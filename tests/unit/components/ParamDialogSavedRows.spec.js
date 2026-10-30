import { createLocalVue, mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import ElementUI from 'element-ui'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import AppMain from '@/layout/components/AppMain.vue'
import ParameterPage from '@/views/CloudNative/ParameterModuleManage/index.vue'
import ParamDialog from '@/components/Dialog/ParamDialog.vue'

async function flush() {
  for (let index = 0; index < 24; index++) await Promise.resolve()
}

// Fields/rules come from the official ivory config_param_defination seed and ConfigParamInfoVO.
// Only the HTTP boundary is supplied here; production validation/edit/save/submit methods are real.
function parameters() {
  return [
    {
      name: 'work_mem',
      paramType: 'VARCHAR',
      defaultValue: '4MB',
      runningValue: '4MB',
      min: '1',
      max: '2048',
      enumValue: null,
      rule: '^[1-9]\\d*(MB){1}$',
      description: '设置在写入临时磁盘文件之前查询操作(例如排序或哈希表)可使用的最大内存容量，改变该参数不需要重启。'
    },
    {
      name: 'max_parallel_workers',
      paramType: 'INTEGER',
      defaultValue: '8',
      runningValue: '8',
      min: '0',
      max: '1024',
      enumValue: null,
      rule: null,
      description: '设置系统为并行操作所支持的工作者的最大数量，其值不超过max_work_processes，改变该参数不需要重启。'
    }
  ]
}

describe('parameter confirmation requires every edit to be saved', () => {
  let wrapper
  let transport
  let localVue
  let message
  let errors
  let savedRoles
  let savedUser

  beforeEach(async() => {
    jest.useFakeTimers()
    savedRoles = localStorage.getItem('roles')
    savedUser = localStorage.getItem('userId')
    localStorage.setItem('roles', JSON.stringify(['routine']))
    localStorage.setItem('userId', 'user-7')
    localVue = createLocalVue()
    localVue.use(VueRouter)
    localVue.use(ElementUI)
    errors = []
    localVue.config.errorHandler = error => errors.push(error)
    const client = axios.create()
    client.defaults.validateStatus = status => status >= 200 && status <= 500
    localVue.prototype.axios = client
    transport = new MockAdapter(client)
    transport.onGet('/instances/list/user-7').reply(200, [{
      id: 'instance-A', name: 'Database A', clusterName: 'Cluster A',
      namespace: 'default', status: 'RUNNING', version: '5.6', type: 'ALONE',
      storageClass: 'standard', storage: 20, cpu: 2, memory: 4,
      network: [{ nodeIp: '192.0.2.10', nodePort: 30080 }]
    }])
    transport.onGet('/clusters').reply(200, [])
    transport.onGet('/instances/instance-A/parameters').reply(200, parameters())
    // The request is observed without fabricating a successful database configuration change.
    transport.onPut('/instances/instance-A/parameters').reply(() => new Promise(() => {}))
    message = { error: jest.fn(), success: jest.fn() }
    localVue.prototype.$message = message
    const router = new VueRouter({
      mode: 'abstract',
      routes: [{ path: '/nativeCloud/ParameterModuleManage/index', component: ParameterPage }]
    })
    router.push('/nativeCloud/ParameterModuleManage/index')
    wrapper = mount(AppMain, { localVue, router, sync: false, stubs: { 'svg-icon': true, transition: false, 'transition-group': false }})
    await flush()
    await wrapper.vm.$nextTick()
    jest.advanceTimersByTime(200)
    await flush()
    const row = wrapper.find('.el-table__body-wrapper').findAll('tbody tr').at(0)
    await row.find('button').trigger('click')
    await flush()
    await wrapper.vm.$nextTick()
    expect(dialog().vm.modifyParamsVisible).toBe(true)
    expect(dialog().props('instanceId')).toBe('instance-A')
    expect(mainRows()).toHaveLength(2)
  })

  afterEach(() => {
    if (wrapper) wrapper.destroy()
    transport.restore()
    jest.clearAllTimers()
    jest.useRealTimers()
    if (savedRoles === null) localStorage.removeItem('roles')
    else localStorage.setItem('roles', savedRoles)
    if (savedUser === null) localStorage.removeItem('userId')
    else localStorage.setItem('userId', savedUser)
  })

  function dialog() {
    return wrapper.find(ParamDialog)
  }

  function mainRows() {
    return dialog().find('.el-table__body-wrapper').findAll('tbody tr')
  }

  async function toggleEdit(index, expectedLabel) {
    const row = dialog().find('.el-table__fixed-right').findAll('tbody tr').at(index)
    const action = row.find('button')
    expect(action.text()).toBe(expectedLabel)
    await action.trigger('click')
    await flush()
    await wrapper.vm.$nextTick()
  }

  async function edit(index, value) {
    await toggleEdit(index, '编辑')
    await mainRows().at(index).find('input').setValue(value)
    await flush()
  }

  async function save(index) {
    await toggleEdit(index, '保存')
    expect(errors).toEqual([])
  }

  async function confirm() {
    await dialog().find('.el-dialog__footer button.el-button--primary').trigger('click')
    await flush()
    await wrapper.vm.$nextTick()
    expect(errors).toEqual([])
  }

  function expectValidPayload() {
    expect(transport.history.put).toHaveLength(1)
    expect(transport.history.put[0].url).toBe('/instances/instance-A/parameters')
    expect(JSON.parse(transport.history.put[0].data)).toEqual({
      description: '',
      params: [
        { paramName: 'work_mem', targetValue: '8MB' },
        { paramName: 'max_parallel_workers', targetValue: '16' }
      ]
    })
    expect(message.success).not.toHaveBeenCalled()
  }

  it('does not send an invalid row after saving another valid row', async() => {
    await edit(0, '0MB')
    await save(0)
    expect(mainRows().at(0).find('input').exists()).toBe(true)
    expect(message.error).toHaveBeenCalled()
    await edit(1, '16')
    await save(1)
    expect(mainRows().at(1).find('input').exists()).toBe(false)
    message.error.mockClear()
    await confirm()

    expect(transport.history.put).toHaveLength(0)
    expect(message.error).toHaveBeenCalledWith('请输入信息并且保存！')
    expect(dialog().vm.modifyParamsVisible).toBe(true)
  })

  it('does not send an unsaved invalid edit after an earlier successful row save', async() => {
    await edit(0, '8MB')
    await save(0)
    await edit(0, '0MB')
    message.error.mockClear()
    await confirm()

    expect(transport.history.put).toHaveLength(0)
    expect(mainRows().at(0).find('input').exists()).toBe(true)
    expect(message.error).toHaveBeenCalledWith('请输入信息并且保存！')
  })

  it('still submits all saved valid rows with the existing request schema', async() => {
    await edit(0, '8MB')
    await save(0)
    await edit(1, '16')
    await save(1)
    await confirm()
    expectValidPayload()
  })

  it('keeps rejecting a single invalid row through the existing save validation', async() => {
    await edit(0, '0MB')
    await save(0)
    await confirm()
    expect(transport.history.put).toHaveLength(0)
    expect(mainRows().at(0).find('input').exists()).toBe(true)
    expect(message.error).toHaveBeenCalled()
  })

  it('can correct the invalid row and submit once every editor has been saved', async() => {
    await edit(0, '0MB')
    await save(0)
    await edit(1, '16')
    await save(1)
    await mainRows().at(0).find('input').setValue('8MB')
    await save(0)
    await confirm()
    expectValidPayload()
  })
})
