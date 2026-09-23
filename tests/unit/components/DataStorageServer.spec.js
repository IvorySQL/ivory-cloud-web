import { createLocalVue, shallowMount } from '@vue/test-utils'
import ElementUI from 'element-ui'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import DataStorageServer from '@/views/CloudNative/DataStorageServer/index'

jest.mock('@/utils/permission', () => jest.fn(() => true))

const localVue = createLocalVue()
localVue.use(ElementUI)
const flushRequests = () => new Promise(resolve => setImmediate(resolve))

describe('Kubernetes cluster request errors', () => {
  let wrapper
  let mock
  let errorMessage

  beforeEach(() => {
    const client = axios.create()
    mock = new MockAdapter(client)
    errorMessage = jest.fn()
    wrapper = shallowMount({ ...DataStorageServer, mounted() {} }, {
      localVue,
      mocks: { axios: client, $message: { error: errorMessage, success: jest.fn() }},
      stubs: ['svg-icon']
    })
  })

  afterEach(() => {
    wrapper.destroy()
    mock.restore()
  })

  it.each(['addhandleSure', 'edithandleSure'])('%s permits retry after a network error', async method => {
    mock.onPost().networkError()
    wrapper.setData({ isButtonLoading: true, dialogFormVisible: true })
    wrapper.vm[method]()
    await flushRequests()
    expect(errorMessage).toHaveBeenCalled()
    expect(wrapper.vm.isButtonLoading).toBe(false)
    expect(wrapper.vm.dialogFormVisible).toBe(true)
  })

  it('clears the table overlay when loading fails', async() => {
    mock.onGet('/clusters').networkError()
    wrapper.vm.getTableList()
    expect(wrapper.vm.listLoading).toBe(true)
    await flushRequests()
    expect(errorMessage).toHaveBeenCalled()
    expect(wrapper.vm.listLoading).toBe(false)
  })

  it('still displays a successful table response', async() => {
    const clusters = [{ clusterId: 'cluster-1', clusterName: 'example' }]
    mock.onGet('/clusters').reply(200, clusters)
    wrapper.vm.getTableList()
    await flushRequests()
    expect(wrapper.vm.list).toEqual(clusters)
    expect(wrapper.vm.listLoading).toBe(false)
    expect(errorMessage).not.toHaveBeenCalled()
  })
})
