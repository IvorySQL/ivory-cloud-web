import { createLocalVue, mount } from '@vue/test-utils'
import ElementUI from 'element-ui'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import SearchBox from '@/components/SearchBox/index.vue'

const localVue = createLocalVue()
localVue.use(ElementUI)

const firstId = '11111111111111111111111111111111'
const secondId = '22222222222222222222222222222222'

function cluster(clusterId, clusterName, serverUrl) {
  return {
    clusterId,
    clusterName,
    serverUrl,
    serverUser: 'root',
    serverSshport: '22',
    configPath: '/root/.kube/config'
  }
}

const first = cluster(firstId, 'Production', '192.0.2.10')
const second = cluster(secondId, 'Production', '192.0.2.20')

async function flush() {
  for (let index = 0; index < 6; index++) {
    await new Promise(resolve => setTimeout(resolve, 0))
  }
}

describe('cluster selection uses the selected cluster identity', () => {
  let wrapper
  let client
  let transport
  let message
  let savedUserId

  beforeEach(() => {
    savedUserId = localStorage.getItem('userId')
    localStorage.setItem('userId', '7')
    client = axios.create()
    transport = new MockAdapter(client)
    transport.onGet('/instances/1/1000').reply(200, { data: [] })
    transport.onGet('/instances/list/7').reply(200, [])
    message = { error: jest.fn() }
  })

  afterEach(() => {
    if (wrapper) wrapper.destroy()
    wrapper = null
    transport.restore()
    if (savedUserId === null) localStorage.removeItem('userId')
    else localStorage.setItem('userId', savedUserId)
  })

  async function open(clusters) {
    transport.onGet('/clusters').reply(200, clusters)
    wrapper = mount(SearchBox, {
      localVue,
      sync: false,
      mocks: { axios: client, $message: message },
      stubs: { transition: false, 'transition-group': false }
    })
    await flush()
    expect(transport.history.get[0].url).toBe('/clusters')
    expect(wrapper.findAll({ name: 'ElOption' }).length).toBe(clusters.length)
  }

  async function select(index) {
    // Use the real ElementUI dropdown and option click; no synthetic model emit.
    const selectBox = wrapper.find({ name: 'ElSelect' })
    await selectBox.find('input').trigger('click')
    await flush()
    const options = wrapper.findAll({ name: 'ElOption' })
    await options.at(index).trigger('click')
    await flush()
  }

  async function clickButton(text) {
    const button = wrapper.findAll('button').wrappers
      .find(item => item.text().trim() === text)
    expect(button).toBeDefined()
    await button.trigger('click')
    await flush()
  }

  async function search(expectedId) {
    await wrapper.find('input[placeholder="请输入ID/名称查询"]').setValue('invoice')
    await clickButton('搜索')
    const requests = transport.history.get.filter(request => request.url === '/instances/1/1000')
    expect(requests).toHaveLength(1)
    // Baseline name lookup overwrites this with the last same-name cluster ID.
    expect(requests[0].params).toEqual({ clusterId: expectedId, filter: 'invoice' })
    expect(wrapper.emitted('resultList')).toEqual([[[], false]])
    expect(message.error).not.toHaveBeenCalled()
  }

  const duplicateOrders = [
    ['A before B', [first, second]],
    ['B before A', [second, first]]
  ]
  duplicateOrders.forEach(([label, clusters]) => {
    it('searches the first chosen same-name cluster with ' + label, async() => {
      await open(clusters)
      await select(0)
      expect(wrapper.find('.el-select input').element.value).toBe('Production')
      await search(clusters[0].clusterId)
    })
  })

  const unique = [
    { ...first, clusterName: 'Production A' },
    { ...second, clusterName: 'Production B' }
  ]
  const uniqueIndices = [0, 1]
  uniqueIndices.forEach(index => {
    it('keeps selection and request behavior for unique name ' + index, async() => {
      await open(unique)
      await select(index)
      expect(wrapper.find('.el-select input').element.value).toBe(unique[index].clusterName)
      await search(unique[index].clusterId)
    })
  })

  it('still resets both selection fields and searches without a cluster filter', async() => {
    await open(unique)
    await select(0)
    await clickButton('重置')
    expect(wrapper.vm.cluster.id).toBe('')
    expect(wrapper.vm.cluster.name).toBe('')
    expect(wrapper.find('.el-select input').element.value).toBe('')
    expect(transport.history.get.some(request => request.url === '/instances/list/7')).toBe(true)
    // The reset result is already emitted; inspect the subsequent search separately.
    await wrapper.find('input[placeholder="请输入ID/名称查询"]').setValue('invoice')
    await clickButton('搜索')
    const request = transport.history.get.find(item => item.url === '/instances/1/1000')
    expect(request.params).toEqual({ clusterId: '', filter: 'invoice' })
    expect(wrapper.emitted('resultList')).toEqual([[[], true], [[], false]])
  })
})
