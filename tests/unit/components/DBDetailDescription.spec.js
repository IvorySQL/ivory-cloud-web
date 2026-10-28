import { createLocalVue, shallowMount } from '@vue/test-utils'
import ElementUI from 'element-ui'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import DBDetail from '@/views/CloudNative/DBDetail/index'

const localVue = createLocalVue()
localVue.use(ElementUI)
const flushRequests = () => new Promise(resolve => jest.requireActual('timers').setImmediate(resolve))

describe('instance description refresh', () => {
  let wrapper
  let mock
  let refresh

  beforeEach(() => {
    jest.useFakeTimers()
    const client = axios.create()
    mock = new MockAdapter(client)
    wrapper = shallowMount({ ...DBDetail, mounted() {}, computed: { dbtype: () => 'IvorySQL' }}, {
      localVue,
      mocks: { axios: client, $message: { error: jest.fn(), success: jest.fn() }},
      stubs: ['svg-icon']
    })
    wrapper.setData({ list: { id: 'instance-1', description: 'old' },
      descForm: { newDesc: 'new' }, modifyDescVisible: true })
    wrapper.vm.$refs.descForm = { validate: callback => callback(true) }
    refresh = jest.spyOn(wrapper.vm, 'getTableList').mockImplementation(() => {})
  })

  afterEach(() => {
    wrapper.destroy()
    mock.restore()
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  it('waits for the save response before refreshing the instance', async() => {
    let finish
    mock.onPatch('/instances/instance-1/description').reply(() => new Promise(resolve => { finish = resolve }))
    wrapper.vm.modifyDesc('descForm')
    jest.advanceTimersByTime(1000)
    expect(refresh).not.toHaveBeenCalled()
    finish([200, {}])
    await flushRequests()
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(wrapper.vm.modifyDescVisible).toBe(false)
  })

  it('does not refresh after a rejected save', async() => {
    mock.onPatch('/instances/instance-1/description').networkError()
    wrapper.vm.modifyDesc('descForm')
    await flushRequests()
    jest.advanceTimersByTime(1000)
    expect(refresh).not.toHaveBeenCalled()
    expect(wrapper.vm.modifyDescVisible).toBe(true)
    expect(wrapper.vm.isButtonLoading).toBe(false)
  })
})
