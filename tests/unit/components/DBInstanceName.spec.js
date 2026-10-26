import { createLocalVue, mount } from '@vue/test-utils'
import ElementUI from 'element-ui'
import Schema from 'async-validator'
import DBInstance from '@/views/CloudNative/DBInstance/index'

const localVue = createLocalVue()
localVue.use(ElementUI)

function nameRules() {
  return DBInstance.data.call({}).rules.name
}

function validateName(name) {
  return new Schema({ name: nameRules() }).validate({ name })
}

async function settle(wrapper) {
  for (let i = 0; i < 4; i++) {
    await Promise.resolve()
    await wrapper.vm.$nextTick()
  }
}

function createWrapper() {
  const axios = {
    get: jest.fn(url => {
      if (url === '/clusters') {
        return Promise.resolve({ status: 200, data: [{ clusterId: 'c1', clusterName: 'cluster' }] })
      }
      if (url === '/clusters/c1/namespace') {
        return Promise.resolve({ status: 200, data: [{ metadata: { name: 'default', uid: 'n1' }}] })
      }
      if (url === '/storage-class') {
        return Promise.resolve({ status: 200, data: [{ metadata: { name: 'standard', id: 's1' }}] })
      }
      return Promise.reject(new Error('Unexpected request: ' + url))
    })
  }
  const router = { push: jest.fn() }
  const message = Object.assign(jest.fn(), { error: jest.fn(), warning: jest.fn() })
  const wrapper = mount(DBInstance, {
    localVue,
    sync: false,
    stubs: { 'svg-icon': true, transition: false, 'transition-group': false },
    mocks: { axios, $route: { query: {}}, $router: router, $message: message }
  })
  return { wrapper, router, axios }
}

describe('instance name follows the visible creation-form contract', () => {
  let oldDbtype
  let oldDbversion

  beforeAll(() => {
    oldDbtype = global.dbtype
    oldDbversion = global.dbversion
    global.dbtype = 'IvorySQL'
    global.dbversion = '5.6'
  })

  beforeEach(() => {
    sessionStorage.clear()
  })

  afterAll(() => {
    if (oldDbtype === undefined) delete global.dbtype
    else global.dbtype = oldDbtype
    if (oldDbversion === undefined) delete global.dbversion
    else global.dbversion = oldDbversion
    sessionStorage.clear()
  })

  test.each(['Db', '数据库', 'db_1', 'db.one', '1db', 'abcdefghij'])(
    'rejects unsupported name %s through the actual form rule', async name => {
      await expect(validateName(name)).rejects.toBeDefined()
    }
  )

  test.each(['a', 'db-1', 'a1234567', 'a-'])(
    'retains supported name %s', async name => {
      await expect(validateName(name)).resolves.toBeUndefined()
    }
  )

  test('reports an invalid name exactly once without a later success callback', () => {
    const callback = jest.fn()
    nameRules()[0].validator({}, '1db', callback)
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback.mock.calls[0][0]).toBeInstanceOf(Error)
  })

  test('keeps the existing empty-name rejection', async() => {
    await expect(validateName('')).rejects.toBeDefined()
  })

  test.each([
    ['Db_1', false],
    ['db-1', true]
  ])('the real Element form gates confirmation for %s', async(name, allowed) => {
    const { wrapper, router, axios } = createWrapper()
    try {
      await settle(wrapper)
      wrapper.setData({
        form: Object.assign({}, wrapper.vm.form, {
          name,
          pass: 'Abcd1234!',
          checkPass: 'Abcd1234!',
          clusterId: 'c1',
          clusterName: 'cluster',
          namespace: 'default',
          storageClass: 'standard'
        })
      })
      await wrapper.vm.$nextTick()
      expect(axios.get).toHaveBeenCalledWith('/clusters')
      wrapper.vm.onSubmit('form')
      await settle(wrapper)
      if (allowed) {
        expect(router.push).toHaveBeenCalledWith({ path: '/nativeCloud/ConfirmOrder/index' })
        expect(JSON.parse(sessionStorage.getItem('createForm')).name).toBe(name)
      } else {
        expect(router.push).not.toHaveBeenCalled()
        expect(sessionStorage.getItem('createForm')).toBeNull()
        expect(wrapper.vm.$refs.form.fields.find(field => field.prop === 'name').validateState).toBe('error')
      }
    } finally {
      wrapper.destroy()
    }
  })
})
