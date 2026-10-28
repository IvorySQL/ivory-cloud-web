import { createLocalVue, mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import ElementUI from 'element-ui'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import AppMain from '@/layout/components/AppMain.vue'
import ModifyPassword from '@/views/Common/modifyPassword/index.vue'

async function flush() {
  for (let index = 0; index < 6; index++) {
    await new Promise(resolve => setTimeout(resolve, 0))
  }
}

describe('routed password reset follows the existing request DTO field names', () => {
  let wrapper
  let router
  let transport
  let message
  let errors
  let intervals
  const username = 'routine_demo'
  const email = 'demo@example.invalid'
  const password = 'Testpass1!'
  const code = '123456'

  beforeEach(async() => {
    const localVue = createLocalVue()
    localVue.use(VueRouter)
    localVue.use(ElementUI)
    errors = []
    localVue.config.errorHandler = error => errors.push(error)
    message = jest.fn()
    message.success = jest.fn()
    message.error = jest.fn()
    message.warning = jest.fn()
    localVue.prototype.$message = message
    const client = axios.create()
    localVue.prototype.axios = client
    transport = new MockAdapter(client)
    // HTTP response boundary only: no DTO/service/parser is emulated here.
    // A business rejection keeps the real component mounted without executing
    // its successful-reset redirect or interacting with any real account.
    transport.onPost('/updateUserInfo').reply(200, {
      success: false,
      message: '验证码已经失效，请重新申请！'
    })
    transport.onPost('/emailVerificationCode').reply(200, {
      success: false,
      message: '用户邮箱不匹配！'
    })
    intervals = jest.spyOn(window, 'setInterval')
    router = new VueRouter({
      mode: 'abstract',
      routes: [{ path: '/modifyPassword', component: ModifyPassword }]
    })
    router.push({ path: '/modifyPassword', query: { username }})
    wrapper = mount(AppMain, {
      localVue,
      router,
      sync: false,
      stubs: { 'svg-icon': true, transition: false, 'transition-group': false }
    })
    await flush()
  })

  afterEach(async() => {
    if (wrapper) wrapper.destroy()
    intervals.mock.results.forEach(result => {
      if (result.type === 'return') window.clearInterval(result.value)
    })
    intervals.mockRestore()
    transport.restore()
    await flush()
  })

  async function fillForm(confirmPassword = password, name = username) {
    const form = wrapper.find(ModifyPassword)
    await form.find('input[name="username"]').setValue(name)
    await form.find('input[name="password"]').setValue(password)
    await form.find('input[name="confirmpass"]').setValue(confirmPassword)
    await form.find('input[name="email"]').setValue(email)
    await form.find('.identifyinput input').setValue(code)
    await flush()
    return form
  }

  const submissions = ['button', 'Enter']
  submissions.forEach(trigger => {
    it(`sends UpdateUserDTO.name through ${trigger} submission`, async() => {
      const form = await fillForm()
      if (trigger === 'button') await form.find('button').trigger('click')
      else await form.find('.identifyinput input').trigger('keyup.enter')
      await flush()
      expect(transport.history.post).toHaveLength(1)
      const request = transport.history.post[0]
      expect(request.url).toBe('/updateUserInfo')
      expect(JSON.parse(request.data)).toEqual({ name: username, password, email, verificationCode: code })
      expect(message.error).toHaveBeenCalledWith('验证码已经失效，请重新申请！')
      expect(router.currentRoute.path).toBe('/modifyPassword')
      expect(errors).toEqual([])
    })
  })

  it('retains real confirmation validation before sending a request', async() => {
    const form = await fillForm('Different1!')
    await form.find('button').trigger('click')
    await flush()
    expect(transport.history.post).toHaveLength(0)
    const confirmation = form.vm.$refs.modifyForm.fields.find(field => field.prop === 'confirmpass')
    expect(confirmation.validateState).toBe('error')
    expect(errors).toEqual([])
  })

  it('retains the existing admin reset restriction', async() => {
    const form = await fillForm(password, 'admin')
    await form.find('button').trigger('click')
    await flush()
    expect(transport.history.post).toHaveLength(0)
    expect(message.warning).toHaveBeenCalledWith('admin用户的密码不能修改，请联系维护人员！')
    expect(errors).toEqual([])
  })

  it('preserves the different UserEmailDTO.userName verification contract', async() => {
    const form = wrapper.find(ModifyPassword)
    expect(form.find('input[name="username"]').element.value).toBe(username)
    await form.find('input[name="email"]').setValue(email)
    await form.find('.button-container span').trigger('click')
    await flush()
    expect(transport.history.post).toHaveLength(1)
    const request = transport.history.post[0]
    expect(request.url).toBe('/emailVerificationCode')
    expect(JSON.parse(request.data)).toEqual({ userEmail: email, userName: username })
    expect(errors).toEqual([])
  })
})
