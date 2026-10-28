import { createLocalVue, mount } from '@vue/test-utils'
import ElementUI from 'element-ui'
import Monitor from '@/views/CloudNative/Monitor/index.vue'

const localVue = createLocalVue()
localVue.use(ElementUI)

const flush = () => new Promise(resolve => setTimeout(resolve, 0))

describe('monitor dialog navigation', () => {
  let wrapper
  let go
  let post
  let open

  beforeEach(async() => {
    go = jest.fn()
    open = jest.spyOn(window, 'open').mockImplementation(() => null)
    post = jest.fn().mockResolvedValue({ data: { monitorStatus: 'CREATING' }})
    wrapper = mount(Monitor, {
      localVue,
      sync: false,
      stubs: ['el-select', 'el-option'],
      mocks: {
        $router: { go },
        axios: {
          get: jest.fn().mockResolvedValue({ data: [{ clusterId: 'cluster-1', clusterName: 'test' }] }),
          post
        },
        $message: { info: jest.fn(), error: jest.fn() }
      }
    })
    await flush()
  })

  afterEach(() => {
    wrapper.destroy()
    open.mockRestore()
  })

  it.each([
    ['creation', { monitorStatus: 'CREATING' }],
    ['empty initialization response', '']
  ])('stays on the monitor page when %s hides the selection dialog', async(label, data) => {
    post.mockResolvedValue({ data })
    const confirm = wrapper.findAll('button').wrappers.find(button => button.text() === '确 定')
    confirm.trigger('click')
    await flush()
    await flush()
    expect(post).toHaveBeenCalledWith('/monitor', expect.objectContaining({ clusterId: 'cluster-1' }), expect.any(Object))
    expect(wrapper.vm.isClusterNotChecked).toBe(false)
    expect(wrapper.vm.createMonitorInProcess).toBe(true)
    expect(go).not.toHaveBeenCalled()
    expect(open).not.toHaveBeenCalled()
  })

  it('opens the running monitor and returns to the previous page exactly once', async() => {
    post.mockResolvedValue({ data: { monitorStatus: 'RUNNING', monitorUrl: 'monitor.example.test:3000' }})
    const confirm = wrapper.findAll('button').wrappers.find(button => button.text() === '确 定')
    confirm.trigger('click')
    await flush()
    await flush()
    expect(open).toHaveBeenCalledTimes(1)
    expect(open).toHaveBeenCalledWith('http://monitor.example.test:3000', '_blank')
    expect(go).toHaveBeenCalledTimes(1)
    expect(go).toHaveBeenCalledWith(-1)
  })

  it('returns to the previous page when the user presses the close icon', async() => {
    wrapper.find('.el-dialog__headerbtn').trigger('click')
    await flush()
    expect(go).toHaveBeenCalledTimes(1)
    expect(go).toHaveBeenCalledWith(-1)
  })

  it('returns to the previous page when the user presses the close button', async() => {
    const close = wrapper.findAll('button').wrappers.find(button => button.text() === '关 闭')
    close.trigger('click')
    await flush()
    expect(go).toHaveBeenCalledTimes(1)
    expect(go).toHaveBeenCalledWith(-1)
  })
})
