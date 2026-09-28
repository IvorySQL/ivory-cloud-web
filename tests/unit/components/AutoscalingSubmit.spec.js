import { createLocalVue, mount } from '@vue/test-utils'
import ElementUI from 'element-ui'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import AutoscalingDetail from '@/views/CloudNative/ExpansionAndContraction/detail.vue'

const localVue = createLocalVue()
localVue.use(ElementUI)
const flush = () => new Promise(resolve => setTimeout(resolve, 0))

describe('autoscaling rule submission', () => {
  let wrapper
  let mock
  let message
  let log
  const rule = { id: 7, alertName: 'CPU high', type: 'CPU', conditionals: 'GT', duration: 80, threshold: 5 }

  const button = text => wrapper.findAll('button').wrappers.find(item => item.text() === text)

  beforeEach(async() => {
    const client = axios.create()
    mock = new MockAdapter(client)
    mock.onGet('/autoscaling/user-1/cluster-1').reply(200, { autoscalingSwitch: 'ON' })
    mock.onGet('/autoscaling/user-1/cluster-1/alert-rule').reply(200, [rule])
    message = { success: jest.fn(), error: jest.fn() }
    log = jest.spyOn(console, 'log').mockImplementation(() => {})
    localStorage.setItem('userId', 'user-1')
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
    button('编辑').trigger('click')
    await flush()
    wrapper.findAll('.el-dialog input').at(0).setValue('85')
    wrapper.findAll('.el-dialog input').at(1).setValue('10')
    button('确 定').trigger('click')
    await flush()
    expect(wrapper.vm.ruleList).toEqual([{ id: 7, duration: 85, threshold: 10 }])
  })

  afterEach(() => {
    wrapper.destroy()
    mock.restore()
    log.mockRestore()
    localStorage.removeItem('userId')
  })

  it.each(['networkErrorOnce', 'timeoutOnce'])('allows retry after %s without losing edits', async(failure) => {
    const request = mock.onPost('/autoscaling/alert-rule')
    if (failure === 'networkErrorOnce') {
      request.networkErrorOnce()
    } else {
      request.timeoutOnce()
    }
    mock.onPost('/autoscaling/alert-rule').reply(200, [rule])
    button('提交').trigger('click')
    await flush()
    await flush()
    expect(message.error).toHaveBeenCalledTimes(1)
    expect(message.success).not.toHaveBeenCalled()
    expect(wrapper.vm.submitStatus).toBe(false)
    expect(button('提交').element.disabled).toBe(false)
    expect(wrapper.vm.ruleList).toEqual([{ id: 7, duration: 85, threshold: 10 }])

    button('提交').trigger('click')
    await flush()
    await flush()
    expect(mock.history.post).toHaveLength(2)
    mock.history.post.forEach(request => {
      expect(JSON.parse(request.data)).toEqual([{ id: 7, duration: 85, threshold: 10 }])
    })
    expect(message.success).toHaveBeenCalledWith('修改成功！')
    expect(wrapper.vm.submitStatus).toBe(false)
    expect(mock.history.get).toHaveLength(4)
  })

  it('keeps submit disabled until a successful request finishes and refreshes the rules', async() => {
    let complete
    mock.onPost('/autoscaling/alert-rule').reply(() => new Promise(resolve => { complete = resolve }))
    button('提交').trigger('click')
    await flush()
    expect(wrapper.vm.submitStatus).toBe(true)
    expect(button('提交').element.disabled).toBe(true)
    complete([200, [rule]])
    await flush()
    await flush()
    expect(wrapper.vm.submitStatus).toBe(false)
    expect(button('提交').element.disabled).toBe(false)
    expect(message.success).toHaveBeenCalledTimes(1)
    expect(message.error).not.toHaveBeenCalled()
    expect(mock.history.get).toHaveLength(4)
  })
})
