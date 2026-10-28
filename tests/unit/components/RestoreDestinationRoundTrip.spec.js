import { createLocalVue, mount } from '@vue/test-utils'
import ElementUI from 'element-ui'
import VueRouter from 'vue-router'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import DBInstance from '@/views/CloudNative/DBInstance/index.vue'
import ConfirmOrder from '@/views/CloudNative/ConfirmOrder/index.vue'

const localVue = createLocalVue()
localVue.use(ElementUI)
localVue.use(VueRouter)

const instancePath = '/nativeCloud/DBInstance/index'
const confirmPath = '/nativeCloud/ConfirmOrder/index'
const originalInstanceId = 'instance-original'
const originalBackupId = 'backup-original'

async function flush() {
  // Drain real Axios, Vue and ElementUI validation work; no fake timers.
  for (let index = 0; index < 6; index++) {
    await new Promise(resolve => setTimeout(resolve, 0))
  }
}

describe('restore destination survives the confirmation back button', () => {
  let app
  let router
  let http
  let transport
  let previousDbtype
  let previousDbversion

  beforeEach(() => {
    previousDbtype = global.dbtype
    previousDbversion = global.dbversion
    global.dbtype = 'IvorySQL'
    global.dbversion = '5.6'
    sessionStorage.clear()
    localStorage.setItem('userId', '7')
    localStorage.setItem('userName', 'tester')
    http = axios.create()
    transport = new MockAdapter(http)
    transport.onGet('/clusters').reply(200, [
      { clusterId: 'cluster-original', clusterName: 'cluster' }
    ])
    transport.onGet('/clusters/cluster-original/namespace').reply(200, [
      { metadata: { uid: 'namespace-id', name: 'default' }}
    ])
    transport.onGet('/storage-class').reply(200, [
      { metadata: { id: 'storage-id', name: 'standard' }}
    ])
    transport.onPost('/instances/' + originalInstanceId + '/restore')
      .reply(200, { status: 'CREATING' })
    transport.onPost('/instances').reply(200, { status: 'CREATING' })
    router = new VueRouter({
      mode: 'abstract',
      routes: [
        { path: instancePath, component: DBInstance },
        { path: confirmPath, component: ConfirmOrder },
        { path: '/nativeCloud/DBManage/index', component: { render: h => h('div') }}
      ]
    })
  })

  afterEach(() => {
    if (app) app.destroy()
    app = null
    transport.restore()
    sessionStorage.clear()
    localStorage.removeItem('userId')
    localStorage.removeItem('userName')
    if (previousDbtype === undefined) delete global.dbtype
    else global.dbtype = previousDbtype
    if (previousDbversion === undefined) delete global.dbversion
    else global.dbversion = previousDbversion
  })

  async function openForm(isRestore) {
    if (isRestore) {
      sessionStorage.setItem('restoreForm', JSON.stringify({
        isRestore: true,
        originalInstanceId,
        originalBackupId,
        clusterId: 'cluster-original'
      }))
    }
    router.push({ path: instancePath, query: isRestore ? { isRestore: true } : {}})
    app = mount({ render: h => h('router-view') }, {
      localVue,
      router,
      sync: false,
      mocks: { axios: http },
      // ElementUI dropdowns require their Select as the non-abstract parent.
      // The installed test-utils TransitionStub is not abstract, unlike Vue's.
      stubs: { 'svg-icon': true, transition: false, 'transition-group': false }
    })
    await flush()
    const form = app.find({ name: 'DBInstance' })
    expect(form.exists()).toBe(true)
    await form.find('.inputName input').setValue('restored')
    const passwordInput = isRestore ? '.inputPwd input' : '#inputPwd'
    await form.find(passwordInput).setValue('Abcd123!')
    await form.find('#confirmPdw').setValue('Abcd123!')
    await flush()
    return form
  }

  async function selectDestination(form, mode) {
    const item = form.findAll({ name: 'ElFormItem' }).wrappers
      .find(field => field.props('prop') === 'restoreType')
    expect(item).toBeDefined()
    await item.findAll('input[type="radio"]').at(mode - 1).setChecked()
    await flush()
    expect(form.vm.form.restoreType).toBe(mode)
  }

  async function next(form) {
    // Exercise the real button and ElForm.validate, never force validate(true).
    await form.find('button.onSubmit').trigger('click')
    await flush()
    expect(router.currentRoute.path).toBe(confirmPath)
    return app.find(ConfirmOrder)
  }

  async function backToForm(confirmation) {
    const back = confirmation.findAll('button').wrappers
      .find(button => button.text() === '上一步')
    expect(back).toBeDefined()
    await back.trigger('click')
    await flush()
    expect(router.currentRoute.path).toBe(instancePath)
    expect(router.currentRoute.query.flag).toBeTruthy()
    return app.find({ name: 'DBInstance' })
  }

  async function submit(confirmation, mode) {
    const confirmData = JSON.parse(sessionStorage.getItem('confirmData'))
    expect(confirmData.restoreType).toBe(mode)
    await confirmation.find('button.onSubmit').trigger('click')
    await flush()
    expect(transport.history.post).toHaveLength(1)
    const request = transport.history.post[0]
    const payload = JSON.parse(request.data)
    if (mode === 1) {
      expect(request.url).toBe('/instances/' + originalInstanceId + '/restore')
      expect(payload).toEqual({ backupId: originalBackupId })
    } else {
      expect(request.url).toBe('/instances')
      expect(payload).toMatchObject({
        name: 'restored',
        clusterId: 'cluster-original',
        namespace: 'default',
        storageClass: 'standard',
        originalInstanceId: mode === 2 ? originalInstanceId : '',
        originalBackupId: mode === 2 ? originalBackupId : ''
      })
    }
  }

  const restoreModes = [1, 2]
  restoreModes.forEach(mode => {
    it('keeps destination ' + mode + ' and its request after going back', async() => {
      const form = await openForm(true)
      await selectDestination(form, mode)
      const confirmation = await next(form)
      const returnedForm = await backToForm(confirmation)
      // Baseline loses the selected radio value here (empty string).
      expect(returnedForm.vm.form.restoreType).toBe(mode)
      expect(returnedForm.vm.form.originalInstanceId).toBe(originalInstanceId)
      expect(returnedForm.vm.form.originalBackupId).toBe(originalBackupId)
      const again = await next(returnedForm)
      await submit(again, mode)
    })
  })

  it('still restores the original instance without a back-button round trip', async() => {
    const form = await openForm(true)
    await selectDestination(form, 1)
    await submit(await next(form), 1)
  })

  it('still creates a normal instance after a back-button round trip', async() => {
    const form = await openForm(false)
    const confirmation = await next(form)
    const returnedForm = await backToForm(confirmation)
    expect(returnedForm.vm.form.isRestore).toBe(false)
    await submit(await next(returnedForm), '')
  })
})
