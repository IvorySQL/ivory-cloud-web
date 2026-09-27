import Modify from '@/views/Common/modifyPassword/index.vue'

import Register from '@/views/Common/register/index.vue'

function view(component, formName, post) {
  const vm = {
    [formName]: { username: 'user123', email: 'user@example.com' },
    inProcess: false,
    totalTime: 120,
    axios: { post },
    $refs: { [formName]: { validateField: (field, done) => done('') }},
    $message: { success: jest.fn(), error: jest.fn() }
  }
  vm.getEmailVerification = component.methods.getEmailVerification.bind(vm)
  return vm
}

async function flush() {
  for (let i = 0; i < 10; i++) await Promise.resolve()
}

describe.each([['password reset', Modify, 'modifyForm'], ['registration', Register, 'registerForm']])('%s verification delivery', (name, component, formName) => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  it('allows retry after the server rejects delivery', async() => {
    const vm = view(component, formName, jest.fn().mockResolvedValue({ status: 200, data: { success: false, message: 'Email mismatch' }}))
    component.methods.validateFields.call(vm)
    await flush()
    expect(vm.inProcess).toBe(false)
    jest.advanceTimersByTime(2000)
    expect(vm.totalTime).toBe(120)
    component.methods.validateFields.call(vm)
    await flush()
    expect(vm.axios.post).toHaveBeenCalledTimes(2)
  })

  it('allows retry after a network failure', async() => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => {})
    try {
      const vm = view(component, formName, jest.fn().mockRejectedValue(new Error('offline')))
      component.methods.validateFields.call(vm)
      await flush()
      expect(vm.inProcess).toBe(false)
      expect(vm.totalTime).toBe(120)
    } finally {
      log.mockRestore()
    }
  })

  it('starts the cooldown only after successful delivery', async() => {
    let resolve
    const vm = view(component, formName, jest.fn(() => new Promise(done => { resolve = done })))
    component.methods.validateFields.call(vm)
    await flush()
    expect(vm.inProcess).toBe(true)
    jest.advanceTimersByTime(2000)
    expect(vm.totalTime).toBe(120)
    component.methods.validateFields.call(vm)
    await flush()
    expect(vm.axios.post).toHaveBeenCalledTimes(1)
    resolve({ status: 200, data: { success: true }})
    await flush()
    jest.advanceTimersByTime(1000)
    expect(vm.totalTime).toBe(119)
    component.methods.validateFields.call(vm)
    await flush()
    expect(vm.axios.post).toHaveBeenCalledTimes(1)
  })
})
