import { createLocalVue, mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import ElementUI from 'element-ui'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import AppMain from '@/layout/components/AppMain.vue'
import DBInstance from '@/views/CloudNative/DBInstance/index.vue'
import ConfirmOrder from '@/views/CloudNative/ConfirmOrder/index.vue'

const instancePath = '/nativeCloud/DBInstance/index'
const confirmationPath = '/nativeCloud/ConfirmOrder/index'

async function flush() {
  for (let index = 0; index < 6; index++) {
    await new Promise(resolve => setTimeout(resolve, 0))
  }
}

describe('instance descriptions follow the existing CreateInstanceVO constraint', () => {
  let wrapper
  let router
  let transport
  let errors
  let previousDbtype
  let previousDbversion
  let previousUser
  let previousUserName
  let previousStorage
  const storageKeys = ['form', 'createForm', 'confirmData', 'restoreForm']

  beforeEach(async() => {
    previousDbtype = global.dbtype
    previousDbversion = global.dbversion
    global.dbtype = 'IvorySQL'
    global.dbversion = '5.6'
    previousUser = localStorage.getItem('userId')
    previousUserName = localStorage.getItem('userName')
    localStorage.setItem('userId', '7')
    localStorage.setItem('userName', 'tester')
    previousStorage = storageKeys.map(key => [key, sessionStorage.getItem(key)])
    storageKeys.forEach(key => sessionStorage.removeItem(key))
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
    transport.onGet('/clusters').reply(200, [{ clusterId: 'cluster-1', clusterName: 'Cluster One' }])
    transport.onGet('/clusters/cluster-1/namespace').reply(200, [
      { metadata: { uid: 'namespace-1', name: 'default' }}
    ])
    transport.onGet('/storage-class').reply(200, [
      { metadata: { uid: 'storage-1', name: 'standard' }}
    ])
    router = new VueRouter({
      mode: 'abstract',
      routes: [
        { path: instancePath, component: DBInstance },
        { path: confirmationPath, component: ConfirmOrder }
      ]
    })
    router.push(instancePath)
    wrapper = mount(AppMain, {
      localVue,
      router,
      sync: false,
      stubs: { 'svg-icon': true, transition: false, 'transition-group': false }
    })
    await flush()
    const form = wrapper.find(DBInstance)
    expect(form.exists()).toBe(true)
    // Fill the actual rendered fields, not component data or validator calls.
    await form.find('.inputName input').setValue('demo')
    await form.find('#inputPwd').setValue('Abcd1234!')
    await form.find('#confirmPdw').setValue('Abcd1234!')
    await flush()
    expect(form.vm.form.namespace).toBe('default')
    expect(form.vm.form.storageClass).toBe('standard')
    expect(errors).toEqual([])
  })

  afterEach(async() => {
    if (wrapper) wrapper.destroy()
    await flush()
    transport.restore()
    for (const [key, value] of previousStorage) {
      if (value == null) sessionStorage.removeItem(key)
      else sessionStorage.setItem(key, value)
    }
    if (previousUser == null) localStorage.removeItem('userId')
    else localStorage.setItem('userId', previousUser)
    if (previousUserName == null) localStorage.removeItem('userName')
    else localStorage.setItem('userName', previousUserName)
    if (previousDbtype === undefined) delete global.dbtype
    else global.dbtype = previousDbtype
    if (previousDbversion === undefined) delete global.dbversion
    else global.dbversion = previousDbversion
  })

  const cases = [
    { label: 'rejects a backslash excluded by the real backend VO', value: String.raw`backup\path`, allowed: false },
    { label: 'retains supported Chinese ASCII and punctuation', value: '备注_Abc.123-测试', allowed: true },
    { label: 'retains the optional empty description', value: '', allowed: true },
    { label: 'retains the existing 128 character boundary', value: 'a'.repeat(128), allowed: true }
  ]

  cases.forEach(({ label, value, allowed }) => {
    it(label, async() => {
      const form = wrapper.find(DBInstance)
      await form.find('textarea').setValue(value)
      await form.find('button.onSubmit').trigger('click')
      await flush()
      // Allow the actual AppMain out-in transition to finish in JSDOM.
      await new Promise(resolve => setTimeout(resolve, 50))
      await flush()
      if (allowed) {
        expect(router.currentRoute.path).toBe(confirmationPath)
        const confirmation = wrapper.find(ConfirmOrder)
        expect(confirmation.exists()).toBe(true)
        expect(confirmation.vm.createForm.description).toBe(value)
        expect(JSON.parse(sessionStorage.getItem('createForm')).description).toBe(value)
      } else {
        expect(router.currentRoute.path).toBe(instancePath)
        expect(sessionStorage.getItem('createForm')).toBeNull()
        expect(wrapper.find(ConfirmOrder).exists()).toBe(false)
        const field = form.vm.$refs.form.fields.find(item => item.prop === 'desc')
        expect(field.validateState).toBe('error')
        expect(field.validateMessage).not.toBe('')
      }
      expect(errors).toEqual([])
    })
  })
})
