import Dialog from '@/components/Dialog/BackupDialog.vue'
import { createBackup, resetForm } from '@/views/CloudNative/Backup/Backup'
function deferred() { let resolve; const promise = new Promise(done => { resolve = done }); return { promise, resolve } }
async function flush() { for (let i = 0; i < 12; i++) await Promise.resolve() }
function view(response) {
  return {
    ...Dialog.data(), instanceId: 'A', backupVisible: true,
    $refs: { backupForm: { validate: done => done(true), resetFields: jest.fn() }},
    $emit: jest.fn(), $confirm: jest.fn().mockResolvedValue(),
    axios: { post: jest.fn(() => response.promise) },
    $parent: { getTableList: jest.fn() },
    $message: { success: jest.fn(), error: jest.fn() }
  }
}
describe('backup dialog request lifetime', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => { jest.clearAllTimers(); jest.useRealTimers() })
  it('does not close a reopened dialog when an old backup completes', async() => {
    const old = deferred(); const vm = view(old)
    createBackup.call(vm, 'backupForm'); await flush()
    expect(vm.axios.post.mock.calls[0][0]).toBe('/instances/A/backups')
    resetForm.call(vm, 'backupForm')
    vm.instanceId = 'B'; vm.backupVisible = true
    old.resolve({ data: { status: 'PROCESSING' }}); await flush()
    expect(vm.backupVisible).toBe(true)
    expect(vm.$message.success).not.toHaveBeenCalled()
  })
  it('keeps the new request loading when the old backup is rejected', async() => {
    const old = deferred(); const vm = view(old)
    createBackup.call(vm, 'backupForm'); await flush()
    resetForm.call(vm, 'backupForm')
    vm.instanceId = 'B'; vm.backupVisible = true; vm.isButtonLoading = true
    old.resolve({ data: { status: 'FAILED', message: 'Old failure' }}); await flush()
    expect(vm.isButtonLoading).toBe(true)
    expect(vm.$message.error).not.toHaveBeenCalled()
  })
  it('still closes the active dialog after success', async() => {
    const current = deferred(); const vm = view(current)
    createBackup.call(vm, 'backupForm'); await flush()
    current.resolve({ data: { status: 'PROCESSING' }}); await flush()
    expect(vm.backupVisible).toBe(false)
    expect(vm.$message.success).toHaveBeenCalledTimes(1)
  })
})
