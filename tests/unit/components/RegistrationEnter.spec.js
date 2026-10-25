import { createLocalVue, mount } from '@vue/test-utils'
import ElementUI from 'element-ui'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import Register from '@/views/Common/register/index.vue'

const localVue = createLocalVue()
localVue.use(ElementUI)
const flush = () => new Promise(resolve => setTimeout(resolve, 0))

describe('registration form submission events', () => {
  let wrapper
  let mock
  let message
  let push

  beforeEach(() => {
    mock = new MockAdapter(axios)
    // Keep successful form submission at the transport boundary. The response
    // schema and backend payload contract are outside this keyboard regression.
    mock.onPost('/userRegister').reply(() => new Promise(() => {}))
    message = { success: jest.fn(), error: jest.fn() }
    push = jest.fn()
    wrapper = mount(Register, {
      localVue,
      sync: false,
      stubs: ['svg-icon', 'router-link'],
      mocks: { $message: message, $router: { push }}
    })
  })

  afterEach(() => {
    if (wrapper) wrapper.destroy()
    mock.restore()
  })

  async function fillValidForm() {
    wrapper.find('input[name="username"]').setValue('exampleuser')
    wrapper.find('input[name="password"]').setValue('secret123')
    wrapper.find('input[name="confirmpass"]').setValue('secret123')
    wrapper.find('input[name="email"]').setValue('example@example.com')
    wrapper.find('.identifyinput input').setValue('123456')
    wrapper.find('input[name="cellphone"]').setValue('13800138000')
    await wrapper.vm.$nextTick()
  }

  async function pressEnter(selector) {
    wrapper.find(selector).trigger('keyup', {
      key: 'Enter', code: 'Enter', keyCode: 13
    })
    await flush()
    await flush()
  }

  function expectRegistrationRequest() {
    expect(mock.history.post).toHaveLength(1)
    expect(mock.history.post[0].url).toBe('/userRegister')
    expect(JSON.parse(mock.history.post[0].data)).toEqual({
      userName: 'exampleuser',
      password: 'secret123',
      email: 'example@example.com',
      cellPhone: '13800138000',
      userType: '2',
      verificationCode: '123456'
    })
    expect(push).not.toHaveBeenCalled()
  }

  it.each([
    ['email', 'input[name="email"]'],
    ['verification code', '.identifyinput input'],
    ['telephone', 'input[name="cellphone"]']
  ])('submits the validated form when Enter is pressed in %s', async(_name, selector) => {
    await fillValidForm()
    await pressEnter(selector)
    expectRegistrationRequest()
  })

  it('keeps the Register button using the same form validation and payload', async() => {
    await fillValidForm()
    wrapper.find('button.el-button--primary').trigger('click')
    await flush()
    await flush()
    expectRegistrationRequest()
  })

  it('does not submit on an ordinary key in the verification field', async() => {
    await fillValidForm()
    wrapper.find('.identifyinput input').trigger('keyup', {
      key: 'a', code: 'KeyA', keyCode: 65
    })
    await flush()
    expect(mock.history.post).toHaveLength(0)
  })

  it('validates the verification code before an Enter submission', async() => {
    await fillValidForm()
    wrapper.find('.identifyinput input').setValue('')
    await pressEnter('.identifyinput input')
    expect(mock.history.post).toHaveLength(0)
    expect(wrapper.find('.el-form-item__error').exists()).toBe(true)
    expect(message.error).toHaveBeenCalledWith('信息填写错误，请检查！')
    expect(push).not.toHaveBeenCalled()
  })

  it('validates matching passwords before an Enter submission', async() => {
    await fillValidForm()
    wrapper.find('input[name="confirmpass"]').setValue('different123')
    await pressEnter('input[name="email"]')
    expect(mock.history.post).toHaveLength(0)
    expect(wrapper.text()).toContain('两次输入的密码不一致！')
    expect(push).not.toHaveBeenCalled()
  })

  it('keeps a server-rejected submission on the registration page', async() => {
    mock.onPost('/userRegister').reply(200, {
      code: 400, success: false, data: null, message: '用户名已存在'
    })
    await fillValidForm()
    wrapper.find('button.el-button--primary').trigger('click')
    await flush()
    await flush()
    expect(mock.history.post).toHaveLength(1)
    expect(message.error).toHaveBeenCalledWith('用户名已存在')
    expect(message.success).not.toHaveBeenCalled()
    expect(push).not.toHaveBeenCalled()
  })
})
