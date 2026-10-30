import { createLocalVue, shallowMount } from '@vue/test-utils'
import ElementUI from 'element-ui'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import ParamDialog from '@/components/Dialog/ParamDialog'

const localVue = createLocalVue()
localVue.use(ElementUI)
const flushRequests = () => new Promise(resolve => jest.requireActual('timers').setImmediate(resolve))

describe('parameter request payloads', () => {
  let wrapper
  let mock

  beforeEach(() => {
    jest.useFakeTimers()
    const client = axios.create()
    mock = new MockAdapter(client)
    wrapper = shallowMount(ParamDialog, {
      localVue,
      propsData: { instanceId: 'instance-a' },
      mocks: { axios: client, $message: { error: jest.fn(), success: jest.fn() }}
    })
    wrapper.setData({ allowCommit: true, parameterList: [
      { name: 'max_connections', targetValue: '200' }
    ] })
  })

  afterEach(() => {
    wrapper.destroy()
    mock.restore()
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  it('rebuilds the payload from current values when retrying a failed request', async() => {
    mock.onPut('/instances/instance-a/parameters').networkError()
    wrapper.vm.modifyParams()
    await flushRequests()
    wrapper.setData({ parameterList: [{ name: 'max_connections', targetValue: '300' }] })
    wrapper.vm.modifyParams()
    await flushRequests()

    expect(JSON.parse(mock.history.put[0].data).params).toEqual([
      { paramName: 'max_connections', targetValue: '200' }
    ])
    expect(JSON.parse(mock.history.put[1].data).params).toEqual([
      { paramName: 'max_connections', targetValue: '300' }
    ])
  })

  it('does not send a previous instance parameter after closing and reopening', async() => {
    mock.onPut().reply(200, {})
    wrapper.vm.modifyParams()
    await flushRequests()
    wrapper.vm.resetInput()
    wrapper.setProps({ instanceId: 'instance-b' })
    wrapper.setData({ allowCommit: true, parameterList: [
      { name: 'work_mem', targetValue: '16MB' }
    ] })
    wrapper.vm.modifyParams()
    await flushRequests()

    expect(mock.history.put[1].url).toBe('/instances/instance-b/parameters')
    expect(JSON.parse(mock.history.put[1].data).params).toEqual([
      { paramName: 'work_mem', targetValue: '16MB' }
    ])
  })
})
