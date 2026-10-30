import { createLocalVue, mount } from '@vue/test-utils'
import ElementUI from 'element-ui'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import AutoscalingDetail from '@/views/CloudNative/ExpansionAndContraction/detail.vue'

const localVue = createLocalVue()
localVue.use(ElementUI)
const flush = () => new Promise(resolve => setTimeout(resolve, 0))

// Same field meanings and ordinary values as the backend's CPUHigh XML rule:
// threshold is the resource bound; duration is the time it must persist.
const highRule = {
  id: 'rule-high',
  alertName: 'CPUHigh',
  type: 'CPU',
  conditionals: 'GT',
  threshold: 80,
  duration: 30
}

describe('autoscaling threshold and duration field contract', () => {
  let wrapper
  let mock
  let client
  let message
  let log
  let priorUserId

  const button = text => wrapper.findAll('button').wrappers.find(
    item => item.text().replace(/\s/g, '') === text
  )

  async function openPage(rule = highRule) {
    mock.onGet('/autoscaling/user-1/cluster-1').reply(200, { autoscalingSwitch: 'ON' })
    mock.onGet('/autoscaling/user-1/cluster-1/alert-rule').reply(200, [{ ...rule }])
    wrapper = mount(AutoscalingDetail, {
      localVue,
      sync: false,
      mocks: {
        axios: client,
        $route: { query: { clusterId: 'cluster-1' }},
        $message: message
      }
    })
    await flush()
    await flush()
  }

  async function openEditor() {
    button('编辑').trigger('click')
    await flush()
    return wrapper.findAll('.el-dialog input')
  }

  beforeEach(() => {
    client = axios.create()
    mock = new MockAdapter(client)
    message = { success: jest.fn(), error: jest.fn() }
    log = jest.spyOn(console, 'log').mockImplementation(() => {})
    priorUserId = localStorage.getItem('userId')
    localStorage.setItem('userId', 'user-1')
  })

  afterEach(() => {
    if (wrapper) wrapper.destroy()
    wrapper = null
    mock.restore()
    log.mockRestore()
    if (priorUserId === null) localStorage.removeItem('userId')
    else localStorage.setItem('userId', priorUserId)
  })

  it.each([
    ['GT', 'CPU', 80, 30, 'CPU>80'],
    ['LT', 'MEMORY', 30, 60, 'MEMORY<30']
  ])('renders %s resource threshold separately from duration', async(conditionals, type, threshold, duration, expression) => {
    await openPage({ ...highRule, conditionals, type, threshold, duration })
    const cells = wrapper.find('.el-table__body-wrapper .el-table__row').findAll('td')
    expect(cells.at(1).text()).toBe(expression)
    expect(cells.at(2).text()).toBe(String(duration))
  })

  it('puts server threshold in the threshold input and duration in the time input', async() => {
    await openPage()
    const inputs = await openEditor()
    expect(inputs.at(0).element.value).toBe('80')
    expect(inputs.at(1).element.value).toBe('30')
    expect(wrapper.findAll({ name: 'ElFormItem' }).at(1).props('prop')).toBe('threshold')
    expect(wrapper.findAll({ name: 'ElFormItem' }).at(2).props('prop')).toBe('duration')
  })

  it('sends edited threshold and time under the original backend keys', async() => {
    await openPage()
    const inputs = await openEditor()
    inputs.at(0).setValue('85')
    inputs.at(1).setValue('45')
    button('确定').trigger('click')
    await flush()
    mock.onPost('/autoscaling/alert-rule').reply(200, [])
    button('提交').trigger('click')
    await flush()
    await flush()
    expect(mock.history.post).toHaveLength(1)
    expect(JSON.parse(mock.history.post[0].data)).toEqual([
      { id: 'rule-high', threshold: 85, duration: 45 }
    ])
    expect(message.error).not.toHaveBeenCalled()
  })

  it('preserves canonical server values and does not submit merely on opening', async() => {
    await openPage()
    await openEditor()
    expect(wrapper.vm.editForm.threshold).toBe(80)
    expect(wrapper.vm.editForm.duration).toBe(30)
    expect(wrapper.vm.editForm.id).toBe('rule-high')
    expect(wrapper.vm.editForm.type).toBe('CPU')
    expect(wrapper.vm.editForm.conditionals).toBe('GT')
    expect(mock.history.post).toHaveLength(0)
  })

  it('retains the existing direct canonical edit-to-payload conversion', async() => {
    await openPage()
    await openEditor()
    // This control bypasses display order only, using the pre-existing model API.
    wrapper.setData({ editForm: { ...wrapper.vm.editForm, threshold: '75', duration: '120' }})
    await wrapper.vm.$nextTick()
    wrapper.vm.handleSure()
    expect(wrapper.vm.ruleList).toEqual([
      { id: 'rule-high', threshold: 75, duration: 120 }
    ])
  })
})

