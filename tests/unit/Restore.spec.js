import { getBackupLists } from '@/views/CloudNative/Restore/Restore'

function deferred() {
  let resolve
  let reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function row(id) {
  return { id, name: id, clusterName: 'cluster', namespace: 'default', clusterId: id }
}

function view(requests) {
  return {
    restoreVisible: false,
    backupLists: [],
    axios: { get: jest.fn(() => requests.shift().promise) },
    $message: { error: jest.fn() }
  }
}

describe('restore backup list requests', () => {
  it('keeps the newest instance when responses arrive out of order', async() => {
    const first = deferred()
    const second = deferred()
    const vm = view([first, second])

    getBackupLists.call(vm, row('first'))
    vm.restoreVisible = false // close the dialog before the first request finishes
    getBackupLists.call(vm, row('second'))
    second.resolve({ data: { data: [{ name: 'second-backup' }] }})
    await second.promise
    await Promise.resolve()
    first.resolve({ data: { data: [{ name: 'first-backup' }] }})
    await first.promise
    await Promise.resolve()

    expect(vm.instanceId).toBe('second')
    expect(vm.clusterId).toBe('second')
    expect(vm.backupLists).toEqual([{ name: 'second-backup' }])
  })

  it('does not restore results or report errors after the dialog closes', async() => {
    const response = deferred()
    const vm = view([response])

    getBackupLists.call(vm, row('first'))
    vm.restoreVisible = false
    response.resolve({ data: { data: [{ name: 'old-backup' }] }})
    await response.promise
    await Promise.resolve()

    expect(vm.backupLists).toEqual([])
    expect(vm.$message.error).not.toHaveBeenCalled()
  })

  it('clears the previous list while loading another instance', async() => {
    const response = deferred()
    const vm = view([response])
    vm.backupLists = [{ name: 'previous-backup' }]

    getBackupLists.call(vm, row('next'))

    expect(vm.instanceId).toBe('next')
    expect(vm.backupLists).toEqual([])
    response.resolve({ data: { data: [{ name: 'next-backup' }] }})
    await response.promise
  })

  it('ignores an old request error but reports the active one', async() => {
    const first = deferred()
    const second = deferred()
    const vm = view([first, second])

    getBackupLists.call(vm, row('first'))
    getBackupLists.call(vm, row('second'))
    first.reject(new Error('first failed'))
    await first.promise.catch(() => {})
    await Promise.resolve()
    expect(vm.$message.error).not.toHaveBeenCalled()

    const error = new Error('second failed')
    second.reject(error)
    await second.promise.catch(() => {})
    await Promise.resolve()
    expect(vm.$message.error).toHaveBeenCalledWith(error)
  })
})
