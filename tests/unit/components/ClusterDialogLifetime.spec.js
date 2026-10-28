import { createLocalVue, mount } from '@vue/test-utils'
import ElementUI from 'element-ui'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import ClusterPage from '@/views/CloudNative/DataStorageServer/index.vue'

const localVue = createLocalVue()
localVue.use(ElementUI)

function cluster(id, name, address) {
  return {
    clusterId: id,
    clusterName: name,
    serverUrl: address,
    serverUser: 'root',
    serverPass: 'example-password',
    serverSshport: '22',
    configPath: '/root/.kube/config'
  }
}

const firstCluster = cluster('cluster-a', 'Cluster A', '192.0.2.10')
const secondCluster = cluster('cluster-b', 'Cluster B', '192.0.2.20')

async function flush() {
  for (let index = 0; index < 6; index++) {
    await new Promise(resolve => setTimeout(resolve, 0))
  }
}

function findButton(scope, text) {
  const button = scope.findAll('button').wrappers
    .find(item => item.text().replace(/\s/g, '') === text)
  expect(button).toBeDefined()
  return button
}

describe('cluster submit callbacks belong to the open dialog', () => {
  let wrapper
  let transport
  let client
  let message
  let savedRoles
  let pendingResponses

  beforeEach(() => {
    savedRoles = localStorage.getItem('roles')
    localStorage.setItem('roles', JSON.stringify(['admin']))
    client = axios.create()
    transport = new MockAdapter(client)
    transport.onGet('/clusters').reply(200, [firstCluster, secondCluster])
    message = { success: jest.fn(), error: jest.fn() }
    pendingResponses = []
  })

  afterEach(async() => {
    // Resolve outstanding HTTP boundaries before destroying the real timer owner.
    pendingResponses.forEach(resolve => resolve([200, firstCluster]))
    await flush()
    if (wrapper) wrapper.destroy()
    wrapper = null
    transport.restore()
    if (savedRoles === null) localStorage.removeItem('roles')
    else localStorage.setItem('roles', savedRoles)
  })

  async function openPage() {
    wrapper = mount(ClusterPage, {
      localVue,
      sync: false,
      mocks: { axios: client, $message: message },
      stubs: { 'svg-icon': true, transition: false, 'transition-group': false }
    })
    await flush()
    expect(wrapper.findAll('.el-table__row').length).toBe(2)
  }

  async function editRow(index) {
    const row = wrapper.findAll('.el-table__row').at(index)
    await findButton(row, '编辑').trigger('click')
    await flush()
    expect(wrapper.vm.dialogFormVisible).toBe(true)
  }

  async function enter(prop, value) {
    const field = wrapper.findAll({ name: 'ElFormItem' }).wrappers
      .find(item => item.props('prop') === prop)
    expect(field).toBeDefined()
    await field.find('input').setValue(value)
    await flush()
  }

  async function startRequest(kind) {
    const url = kind === 'edit' ? '/clusters/update' : '/clusters/add'
    let complete
    const pending = new Promise(resolve => { complete = resolve })
    pendingResponses.push(complete)
    transport.onPost(url).replyOnce(() => pending)
    if (kind === 'edit') {
      await editRow(0)
    } else {
      await findButton(wrapper, '增加Kubernetes集群').trigger('click')
      await flush()
      await enter('serverUrl', '192.0.2.30')
      await enter('clusterName', 'New cluster')
      await enter('serverUser', 'root')
      await enter('serverPass', 'example-password')
    }
    const dialog = wrapper.find('.el-dialog')
    await findButton(dialog, '确定').trigger('click')
    await flush()
    // Real ElementUI validation and actual Axios serialization have completed.
    expect(transport.history.post).toHaveLength(1)
    expect(transport.history.post[0].url).toBe(url)
    const payload = JSON.parse(transport.history.post[0].data)
    expect(payload.serverUser).toBe('root')
    if (kind === 'edit') {
      expect(payload.clusterId).toBe(firstCluster.clusterId)
      expect(payload.clusterName).toBe(firstCluster.clusterName)
    } else {
      expect(payload.clusterName).toBe('New cluster')
    }
    expect(wrapper.vm.isButtonLoading).toBe(true)
    return complete
  }

  async function cancelAndEdit(index, draftName) {
    // Cancel is genuinely enabled while the submit button is loading.
    const cancel = findButton(wrapper.find('.el-dialog'), '取消')
    expect(cancel.element.disabled).toBe(false)
    await cancel.trigger('click')
    await flush()
    expect(wrapper.vm.dialogFormVisible).toBe(false)
    await editRow(index)
    await enter('clusterName', draftName)
  }

  const submittedKinds = ['edit', 'add']
  submittedKinds.forEach(kind => {
    it('keeps a newer edit open after an old ' + kind + ' succeeds', async() => {
      await openPage()
      const complete = await startRequest(kind)
      await cancelAndEdit(1, 'Unsaved B')
      complete([200, firstCluster])
      await flush()

      // Baseline closes this new dialog and resets its live edit data.
      expect(wrapper.vm.dialogFormVisible).toBe(true)
      expect(wrapper.vm.editFlag).toBe(true)
      expect(wrapper.vm.editForm.clusterId).toBe(secondCluster.clusterId)
      expect(wrapper.vm.editForm.clusterName).toBe('Unsaved B')
      expect(wrapper.find('.el-dialog input').element.value).toBe(secondCluster.serverUrl)
      expect(transport.history.post).toHaveLength(1)
    })
  })

  it('also protects a reopened edit of the same cluster', async() => {
    await openPage()
    const complete = await startRequest('edit')
    await cancelAndEdit(0, 'Unsaved A')
    complete([200, firstCluster])
    await flush()

    expect(wrapper.vm.dialogFormVisible).toBe(true)
    expect(wrapper.vm.editFlag).toBe(true)
    expect(wrapper.vm.editForm.clusterId).toBe(firstCluster.clusterId)
    expect(wrapper.vm.editForm.clusterName).toBe('Unsaved A')
  })

  submittedKinds.forEach(kind => {
    it('still closes the active ' + kind + ' dialog on its own success', async() => {
      await openPage()
      const complete = await startRequest(kind)
      complete([200, firstCluster])
      await flush()

      expect(wrapper.vm.dialogFormVisible).toBe(false)
      expect(message.success).toHaveBeenCalledTimes(1)
      expect(message.error).not.toHaveBeenCalled()
      expect(transport.history.get.filter(request => request.url === '/clusters').length)
        .toBeGreaterThan(1)
    })
  })
})
