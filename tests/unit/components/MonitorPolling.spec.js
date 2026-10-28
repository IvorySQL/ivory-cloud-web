import { createLocalVue, mount } from '@vue/test-utils'
import ElementUI from 'element-ui'
import axios from 'axios'
import Monitor from '@/views/CloudNative/Monitor/index.vue'

const localVue = createLocalVue()
localVue.use(ElementUI)
const settle = async() => {
  for (let i = 0; i < 20; i++) await Promise.resolve()
  await localVue.nextTick()
}

describe('monitor readiness polling', () => {
  let wrapper
  let posts
  let responses
  let open
  let go

  beforeEach(async() => {
    posts = []
    responses = []
    go = jest.fn()
    open = jest.spyOn(window, 'open').mockImplementation(() => null)
    const client = axios.create({
      adapter: config => {
        let data
        if (config.method === 'get') {
          data = [{ clusterId: 'cluster-1', clusterName: 'test' }]
        } else {
          posts.push(JSON.parse(config.data))
          data = responses.shift()
        }
        return Promise.resolve({ data: JSON.stringify(data), status: 200,
          statusText: 'OK', headers: {}, config })
      }
    })
    wrapper = mount(Monitor, {
      localVue,
      sync: false,
      stubs: ['el-select', 'el-option'],
      mocks: { axios: client, $router: { go },
        $message: { info: jest.fn(), error: jest.fn() }}
    })
    await settle()
    jest.useFakeTimers()
  })

  afterEach(() => {
    if (wrapper) wrapper.destroy()
    jest.clearAllTimers()
    jest.useRealTimers()
    open.mockRestore()
  })

  const confirm = async() => {
    wrapper.findAll('button').wrappers.find(b => b.text() === '确 定').trigger('click')
    await settle()
  }

  it.each([
    ['creating', { monitorStatus: 'CREATING' }],
    ['empty initialization', '']
  ])('continues %s until a later response reports readiness', async(label, initial) => {
    responses.push(initial, { monitorStatus: 'CREATING' },
      { monitorStatus: 'RUNNING', monitorUrl: 'monitor.example.test:3000' })
    await confirm()
    expect(wrapper.vm.isClusterNotChecked).toBe(false)
    expect(go).not.toHaveBeenCalled()
    for (let i = 0; i < 2; i++) {
      jest.advanceTimersByTime(10000)
      await settle()
    }
    expect(posts).toHaveLength(3)
    expect(posts.every(p => p.clusterId === 'cluster-1')).toBe(true)
    expect(open).toHaveBeenCalledTimes(1)
    expect(open).toHaveBeenCalledWith('http://monitor.example.test:3000', '_blank')
    expect(go).toHaveBeenCalledTimes(1)
    jest.advanceTimersByTime(30000)
    await settle()
    expect(posts).toHaveLength(3)
    expect(open).toHaveBeenCalledTimes(1)
  })

  it('does not start polling for an immediately running monitor', async() => {
    responses.push({ monitorStatus: 'RUNNING', monitorUrl: 'monitor.example.test:3000' })
    await confirm()
    jest.advanceTimersByTime(30000)
    await settle()
    expect(posts).toHaveLength(1)
    expect(open).toHaveBeenCalledTimes(1)
    expect(go).toHaveBeenCalledWith(-1)
  })

  it('stops issuing readiness requests after the component is destroyed', async() => {
    responses.push({ monitorStatus: 'CREATING' }, { monitorStatus: 'CREATING' })
    await confirm()
    const count = posts.length
    wrapper.destroy()
    wrapper = null
    jest.advanceTimersByTime(30000)
    await settle()
    expect(posts).toHaveLength(count)
    expect(open).not.toHaveBeenCalled()
  })
})
