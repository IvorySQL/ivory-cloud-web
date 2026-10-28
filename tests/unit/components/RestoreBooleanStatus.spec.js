import { createLocalVue, mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import ElementUI from 'element-ui'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import AppMain from '@/layout/components/AppMain.vue'
import Restore from '@/views/CloudNative/Restore/index.vue'
import RestoreDialog from '@/components/Dialog/RestoreDialog.vue'

async function flush() {
  for (let index = 0; index < 24; index++) await Promise.resolve()
}

// Types and values follow BackupController -> BackupServiceImpl.listBackup ->
// PageInfo<List<BackupVO>>. isRestoring is Boolean, not a string. The restore
// producer actually sets BackupPO.isRestoring=true before saving the record.
const backupPage = {
  pageNo: 1,
  pageSize: 1000,
  totalCount: 2,
  data: [
    {
      id: 'backup-active',
      instanceId: 'instance-A',
      name: 'Active backup',
      description: 'Currently restoring',
      status: 'RESTORING',
      backupType: 'PHYSICAL',
      backupMode: 'FULL',
      backupMethod: 'MANUAL',
      isRestoring: true
    },
    {
      id: 'backup-idle',
      instanceId: 'instance-A',
      name: 'Idle backup',
      description: 'Not restoring',
      status: 'COMPLETED',
      backupType: 'PHYSICAL',
      backupMode: 'FULL',
      backupMethod: 'MANUAL',
      isRestoring: false
    }
  ]
}

describe('restoring status from the real backup-list response contract', () => {
  let wrapper
  let transport
  let errors
  let savedUser
  let savedRoles

  beforeEach(async() => {
    jest.useFakeTimers()
    savedUser = localStorage.getItem('userId')
    savedRoles = localStorage.getItem('roles')
    localStorage.setItem('userId', 'user-7')
    localStorage.setItem('roles', JSON.stringify(['routine']))
    const localVue = createLocalVue()
    localVue.use(VueRouter)
    localVue.use(ElementUI)
    errors = []
    localVue.config.errorHandler = error => errors.push(error)
    const message = jest.fn()
    message.error = jest.fn()
    localVue.prototype.$message = message
    const client = axios.create()
    localVue.prototype.axios = client
    transport = new MockAdapter(client)
    transport.onGet('/clusters').reply(200, [])
    transport.onGet('/instances/list/user-7').reply(200, [{
      id: 'instance-A',
      name: 'Database A',
      clusterId: 'cluster-A',
      clusterName: 'Cluster A',
      namespace: 'default',
      status: 'RUNNING',
      version: '5.6',
      type: 'ALONE',
      storageClass: 'standard',
      storage: 20,
      cpu: 2,
      memory: 4,
      network: [{ nodeIp: '192.0.2.10', nodePort: 30080 }]
    }])
    transport.onGet('/instances/instance-A/backups/1/1000?filter=').reply(200, backupPage)
    const router = new VueRouter({
      mode: 'abstract',
      routes: [{ path: '/nativeCloud/Restore/index', component: Restore }]
    })
    router.push('/nativeCloud/Restore/index')
    wrapper = mount(AppMain, {
      localVue,
      router,
      sync: false,
      stubs: { 'svg-icon': true, transition: false, 'transition-group': false }
    })
    await flush()
    await wrapper.vm.$nextTick()
    jest.advanceTimersByTime(200)
    await flush()
    const view = wrapper.findAll('button').wrappers.find(button => button.text() === '查看')
    expect(view).toBeDefined()
    await view.trigger('click')
    await flush()
    await wrapper.vm.$nextTick()
    expect(wrapper.find(RestoreDialog).vm.restoreVisible).toBe(true)
    expect(errors).toEqual([])
  })

  afterEach(async() => {
    if (wrapper) wrapper.destroy()
    await flush()
    transport.restore()
    jest.clearAllTimers()
    jest.useRealTimers()
    if (savedUser == null) localStorage.removeItem('userId')
    else localStorage.setItem('userId', savedUser)
    if (savedRoles == null) localStorage.removeItem('roles')
    else localStorage.setItem('roles', savedRoles)
  })

  function renderedStatus(name) {
    const dialog = wrapper.find(RestoreDialog)
    const headers = dialog.findAll('.el-table__header-wrapper th').wrappers
    const column = headers.findIndex(header => header.text() === '恢复中')
    expect(column).toBeGreaterThanOrEqual(0)
    const row = dialog.findAll('.el-table__body-wrapper tbody tr').wrappers
      .find(item => item.text().includes(name))
    expect(row).toBeDefined()
    return row.findAll('td').at(column).text()
  }

  it('renders 是 for the Boolean true emitted while restoring a backup', () => {
    expect(renderedStatus('Active backup')).toBe('是')
  })

  it('continues rendering 否 for the Boolean false inactive record', () => {
    expect(renderedStatus('Idle backup')).toBe('否')
  })

  it('retains typed fields through the real request and parent-child chain', () => {
    const dialog = wrapper.find(RestoreDialog)
    expect(transport.history.get.some(request =>
      request.url === '/instances/instance-A/backups/1/1000?filter=')).toBe(true)
    expect(dialog.props('backupLists').map(row => row.isRestoring)).toEqual([true, false])
    expect(dialog.text()).toContain('Active backup')
    expect(dialog.text()).toContain('Idle backup')
    expect(dialog.text()).toContain('物理')
    expect(dialog.text()).toContain('全量')
    expect(dialog.text()).toContain('手动')
    expect(errors).toEqual([])
  })
})
