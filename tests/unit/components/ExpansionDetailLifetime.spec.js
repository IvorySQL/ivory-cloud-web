import { createLocalVue, mount } from '@vue/test-utils'
import ElementUI from 'element-ui'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import Expansion from '@/views/CloudNative/DBExpansion/index.vue'
import ExpansionDialog from '@/components/Dialog/ExpansionDialog.vue'

const localVue = createLocalVue()
localVue.use(ElementUI)

async function flush() {
  for (let i = 0; i < 20; i++) await Promise.resolve()
  await localVue.nextTick()
}

function instance(id) {
  return {
    id, name: 'Database ' + id, clusterName: 'cluster-' + id,
    namespace: 'default', status: 'RUNNING', version: '5.6', type: 'ALONE',
    storageClass: 'standard', storage: 20, cpu: 1, memory: 1,
    createdAt: '2026-10-26', network: [{ nodeIp: '192.0.2.10', nodePort: 5432 }]
  }
}

describe('disk expansion detail request lifetime', () => {
  let wrapper
  let mock
  let requests
  let message

  beforeEach(async() => {
    jest.useFakeTimers()
    localStorage.setItem('userId', 'user-123')
    localStorage.setItem('roles', JSON.stringify(['routine']))
    const client = axios.create()
    localVue.prototype.axios = client
    mock = new MockAdapter(client)
    requests = []
    mock.onGet('/instances/list/user-123').reply(200, [
      instance('instance-A'), instance('instance-B')
    ])
    mock.onGet(/^\/instances\/instance-/).reply(config => new Promise(resolve => {
      requests.push({ url: config.url, resolve })
    }))
    // Observe the real submit target without inventing a completed backend job.
    mock.onPost().reply(() => new Promise(() => {}))
    message = { success: jest.fn(), error: jest.fn() }
    wrapper = mount(Expansion, {
      localVue,
      sync: false,
      stubs: { SSearchBox: true },
      mocks: { $message: message }
    })
    await flush()
    jest.advanceTimersByTime(200)
    await flush()
  })

  afterEach(() => {
    if (wrapper) wrapper.destroy()
    wrapper = null
    mock.restore()
    jest.clearAllTimers()
    jest.useRealTimers()
    localStorage.clear()
    delete localVue.prototype.axios
  })

  function dialog() {
    return wrapper.find(ExpansionDialog)
  }

  async function openRow(index) {
    const row = wrapper.find('.el-table__body-wrapper').findAll('tbody tr').at(index)
    row.find('button').trigger('click')
    await flush()
    expect(dialog().vm.storageExpansionVisible).toBe(true)
  }

  async function cancelDialog() {
    const buttons = dialog().findAll('.el-dialog__footer button')
    buttons.at(1).trigger('click')
    await flush()
    expect(wrapper.vm.storageExpansionVisible).toBe(false)
  }

  async function detail(index, storage) {
    requests[index].resolve([200, { storage }])
    await flush()
  }

  async function submit(storage) {
    dialog().find('input').setValue(storage)
    await flush()
    dialog().find('.el-dialog__footer button.el-button--primary').trigger('click')
    await flush()
    expect(mock.history.post).toHaveLength(1)
  }

  it('keeps B selected when A detail arrives after B and posts only to B', async() => {
    await openRow(0)
    expect(requests[0].url).toBe('/instances/instance-A')
    await cancelDialog()
    await openRow(1)
    expect(requests[1].url).toBe('/instances/instance-B')
    await detail(1, 40)
    expect(wrapper.vm.instanceId).toBe('instance-B')
    await detail(0, 20)
    await submit('80')
    expect(mock.history.post[0].url).toBe('/instances/instance-B/action/storage')
    expect(JSON.parse(mock.history.post[0].data)).toEqual({ storageSize: '80' })
    expect(wrapper.vm.instanceId).toBe('instance-B')
    expect(wrapper.vm.storageForm.storage).toBe(40)
    expect(dialog().text()).toContain('Database instance-B')
  })

  it('does not repopulate a closed dialog from its pending detail request', async() => {
    await openRow(0)
    await cancelDialog()
    await detail(0, 20)
    expect(wrapper.vm.storageExpansionVisible).toBe(false)
    expect(wrapper.vm.instanceId).toBe('')
    expect(wrapper.vm.storageForm.storage).toBe('')
    expect(mock.history.post).toHaveLength(0)
  })

  it('keeps the newest details after closing and reopening the same instance', async() => {
    await openRow(0)
    await cancelDialog()
    await openRow(0)
    await detail(1, 60)
    await detail(0, 20)
    expect(wrapper.vm.instanceId).toBe('instance-A')
    expect(wrapper.vm.storageForm.storage).toBe(60)
    await submit('100')
    expect(mock.history.post[0].url).toBe('/instances/instance-A/action/storage')
  })

  it('ignores an older request rejection while the B dialog remains open', async() => {
    await openRow(0)
    await cancelDialog()
    await openRow(1)
    await detail(1, 40)
    requests[0].resolve([503, { message: 'old request unavailable' }])
    await flush()
    expect(message.error).not.toHaveBeenCalled()
    expect(wrapper.vm.storageExpansionVisible).toBe(true)
    expect(wrapper.vm.instanceId).toBe('instance-B')
    expect(wrapper.vm.storageForm.storage).toBe(40)
  })

  it('loads and submits the current instance normally', async() => {
    await openRow(0)
    await detail(0, 20)
    expect(dialog().text()).toContain('Database instance-A')
    expect(wrapper.vm.storageForm.storage).toBe(20)
    await submit('40')
    expect(mock.history.post[0].url).toBe('/instances/instance-A/action/storage')
    expect(JSON.parse(mock.history.post[0].data)).toEqual({ storageSize: '40' })
    expect(message.error).not.toHaveBeenCalled()
  })

  it('still reports a rejection from the current detail request', async() => {
    await openRow(1)
    requests[0].resolve([503, { message: 'current request unavailable' }])
    await flush()
    expect(message.error).toHaveBeenCalledTimes(1)
    expect(wrapper.vm.storageExpansionVisible).toBe(true)
    expect(mock.history.post).toHaveLength(0)
  })
})
