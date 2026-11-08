import http from 'http'
import Vue from 'vue'
import { createLocalVue, mount } from '@vue/test-utils'
import ElementUI from 'element-ui'
import axios from 'axios'
import Backup from '@/views/CloudNative/Backup/index.vue'
import MainTable from '@/components/MainTable/index.vue'
import SearchBox from '@/components/SearchBox/index.vue'

const flush = () => new Promise(resolve => setImmediate(resolve))
async function until(predicate) {
  const deadline = Date.now() + 2500
  while (!predicate()) {
    if (Date.now() >= deadline) throw new Error('HTTP/component state did not settle')
    await flush()
  }
  await Vue.nextTick()
}
const rows = id => [{ id, name: id, status: 'RUNNING', network: null }]
function send(response, data, status = 200) {
  response.writeHead(status, { 'Content-Type': 'application/json' })
  response.end(JSON.stringify(data))
}

describe('instance polling and search ownership through HTTP', () => {
  let server
  let wrapper
  let pending
  let calls
  let errors
  let completedLists
  let sockets
  let table
  let search

  beforeEach(async() => {
    pending = []
    calls = 0
    errors = []
    completedLists = 0
    sockets = new Set()
    server = http.createServer((request, response) => {
      if (request.url === '/clusters') return send(response, [])
      if (request.url.startsWith('/instances/1/1000')) {
        return send(response, { data: rows('selected') })
      }
      if (request.url === '/instances/list/user-1') {
        calls++
        if (calls === 1) return send(response, rows('initial'))
        pending.push(response)
        return
      }
      send(response, { error: request.url }, 404)
    })
    server.on('connection', socket => {
      sockets.add(socket)
      socket.on('close', () => sockets.delete(socket))
    })
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
    const localVue = createLocalVue()
    localVue.use(ElementUI)
    localVue.prototype.axios = axios.create({
      baseURL: `http://127.0.0.1:${server.address().port}`,
      adapter: require('axios/lib/adapters/http'), proxy: false
    })
    localVue.prototype.axios.interceptors.response.use(response => {
      if (response.config.url === '/instances/list/user-1') completedLists++
      return response
    }, error => {
      if (error.config.url === '/instances/list/user-1') completedLists++
      return Promise.reject(error)
    })
    localVue.prototype.$message = { error: error => errors.push(error) }
    localStorage.setItem('userId', 'user-1')
    localStorage.setItem('roles', JSON.stringify(['routine']))
    wrapper = mount(Backup, { localVue, stubs: ['el-select', 'el-option'] })
    await until(() => wrapper.find(MainTable).exists())
    table = wrapper.find(MainTable)
    search = wrapper.find(SearchBox)
    await until(() => table.vm.list.length === 1)
  })

  afterEach(async() => {
    if (wrapper) wrapper.destroy()
    for (const response of pending) if (!response.finished) send(response, [])
    await flush()
    const closed = new Promise(resolve => server.close(resolve))
    for (const socket of sockets) socket.destroy()
    await closed
    localStorage.clear()
  })

  async function startPoll() {
    wrapper.vm.getTableList2()
    const count = pending.length
    await until(() => pending.length > count)
    return pending[pending.length - 1]
  }

  async function selectRows() {
    search.vm.keyword = 'selected'
    search.vm.btnSearch()
    await until(() => table.vm.list[0].id === 'selected')
    expect(wrapper.vm.clock).toBe(null)
  }

  async function complete(response, data, status = 200) {
    const completed = completedLists
    send(response, data, status)
    await until(() => completedLists > completed)
    await flush()
    await Vue.nextTick()
  }

  it('keeps filtered results when an older parent poll completes', async() => {
    const response = await startPoll()
    await selectRows()
    await complete(response, rows('stale-poll'))
    expect(table.vm.list.map(row => row.id)).toEqual(['selected'])
  })

  it('continues applying polls while the polling session is active', async() => {
    const response = await startPoll()
    send(response, rows('current-poll'))
    await until(() => table.vm.list[0].id === 'current-poll')
    expect(wrapper.vm.clock).not.toBe(null)
    expect(errors).toEqual([])
  })

  it('does not report an old poll failure after successful search', async() => {
    const response = await startPoll()
    await selectRows()
    await complete(response, { message: 'obsolete poll failed' }, 500)
    expect(errors).toEqual([])
    expect(table.vm.list.map(row => row.id)).toEqual(['selected'])
  })

  it('reports current polling failures', async() => {
    const response = await startPoll()
    await complete(response, { message: 'current poll failed' }, 500)
    expect(errors).toHaveLength(1)
    expect(table.vm.list.map(row => row.id)).toEqual(['initial'])
  })

  it('resumes polling after reset without reviving a retired request', async() => {
    const retired = await startPoll()
    await selectRows()
    search.vm.btnReset()
    await until(() => pending.length === 2)
    await complete(pending[1], rows('reset'))
    await until(() => wrapper.vm.clock !== null)
    expect(table.vm.list.map(row => row.id)).toEqual(['reset'])
    const current = await startPoll()
    await complete(retired, rows('retired-session'))
    expect(table.vm.list.map(row => row.id)).toEqual(['reset'])
    await complete(current, rows('resumed-poll'))
    expect(table.vm.list.map(row => row.id)).toEqual(['resumed-poll'])
  })

  it('does not report a poll failure after its page is destroyed', async() => {
    const response = await startPoll()
    wrapper.destroy()
    expect(wrapper.vm.clock).toBe(null)
    await complete(response, { message: 'destroyed page poll failed' }, 500)
    expect(errors).toEqual([])
  })
})
