import { createLocalVue, mount } from '@vue/test-utils'
import ElementUI from 'element-ui'
import MainTable from '@/components/MainTable/index'

const localVue = createLocalVue()
localVue.use(ElementUI)

function instance(network) {
  return {
    id: 'instance-pending', name: 'Example database', status: 'CREATING',
    version: '5.6', type: 'ALONE', namespace: 'default', storageClass: 'standard',
    storage: 10, cpu: 1, memory: 1, createdAt: '2026-10-19', network
  }
}

describe('MainTable instance network rendering', () => {
  let wrapper

  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    if (wrapper) wrapper.destroy()
    wrapper = null
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  async function render(rows) {
    wrapper = mount(MainTable, {
      localVue,
      sync: false,
      propsData: { tableList: rows, roleFlag: '' },
      stubs: { SSearchBox: true }
    })
    await wrapper.vm.$nextTick()
    jest.advanceTimersByTime(151)
    await wrapper.vm.$nextTick()
  }

  function cellText(label, rowIndex = 0) {
    const headers = wrapper.find('.el-table__header-wrapper').findAll('th')
    const index = headers.wrappers.findIndex(header => header.text() === label)
    expect(index).toBeGreaterThanOrEqual(0)
    return wrapper.find('.el-table__body-wrapper').findAll('tbody tr')
      .at(rowIndex).findAll('td').at(index).text()
  }

  test.each([
    ['empty array', []],
    ['null', null],
    ['missing network', undefined]
  ])('keeps instances visible with %s', async(_name, network) => {
    await render([instance(network)])
    expect(wrapper.text()).toContain('Example database')
    expect(cellText('地址')).toBe('')
    expect(cellText('端口')).toBe('')
  })

  test('displays the first available endpoint', async() => {
    await render([instance([
      { nodeIp: '192.0.2.10', nodePort: 5432 },
      { nodeIp: '192.0.2.11', nodePort: 5433 }
    ])])
    expect(cellText('地址')).toBe('192.0.2.10')
    expect(cellText('端口')).toBe('5432')
  })

  test('renders a pending instance alongside one with an endpoint', async() => {
    await render([
      instance([]),
      { ...instance([{ nodeIp: '192.0.2.20', nodePort: 5432 }]), id: 'ready' }
    ])
    expect(cellText('地址', 0)).toBe('')
    expect(cellText('地址', 1)).toBe('192.0.2.20')
  })

  test('updates when polling supplies an endpoint for a pending instance', async() => {
    await render([instance([])])
    wrapper.setProps({
      tableList: [instance([{ nodeIp: '192.0.2.30', nodePort: 5432 }])]
    })
    await wrapper.vm.$nextTick()
    expect(cellText('地址')).toBe('192.0.2.30')
    expect(cellText('端口')).toBe('5432')
  })

  test('clears an endpoint when polling returns an empty array', async() => {
    await render([instance([{ nodeIp: '192.0.2.40', nodePort: 5432 }])])
    wrapper.setProps({ tableList: [instance([])] })
    await wrapper.vm.$nextTick()
    expect(cellText('地址')).toBe('')
    expect(cellText('端口')).toBe('')
  })
})
