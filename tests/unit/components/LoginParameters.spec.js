import { createLocalVue, mount } from '@vue/test-utils'
import ElementUI from 'element-ui'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import Login from '@/views/Common/UserLogin/index.vue'

const localVue = createLocalVue()
localVue.use(ElementUI)
const flush = () => new Promise(resolve => setTimeout(resolve, 0))

describe('login request parameters', () => {
  let wrapper
  let mock
  let client
  let received
  let push
  let originalDollar
  let originalRegister
  let forward

  beforeEach(() => {
    originalDollar = global.$
    originalRegister = global.globalShowRegister
    global.$ = () => ({ on: jest.fn() })
    global.globalShowRegister = false
    forward = jest.spyOn(window.history, 'forward').mockImplementation(() => {})
    client = axios.create()
    mock = new MockAdapter(client)
    mock.onPost().reply(config => {
      received = new URL(client.getUri(config), 'http://localhost').searchParams
      return [200, { code: '200', message: '操作成功！', data: { userId: 'test-user', roles: ['routine'] }}, { authorization: 'test-token' }]
    })
    mock.onGet('/getAllDataBasesForUser').reply(200, [{ id: 'test-instance' }])
    push = jest.fn()
    wrapper = mount(Login, {
      localVue,
      sync: false,
      stubs: ['svg-icon', 's-identify', 'router-link'],
      mocks: {
        axios: client,
        $md5: jest.fn(),
        $message: jest.fn(),
        $router: { push }
      }
    })
  })

  afterEach(() => {
    wrapper.destroy()
    mock.restore()
    forward.mockRestore()
    global.$ = originalDollar
    global.globalShowRegister = originalRegister
    localStorage.clear()
  })

  it.each([
    ['plain-user', 'plain123'],
    ['test-user', 'abc&123'],
    ['test-user', 'abc+123'],
    ['test-user', 'abc#123'],
    ['test-user', 'abc%26123'],
    ['test+user', 'plain123']
  ])('preserves username %s and password %s after query decoding', async(username, password) => {
    wrapper.find('input[name="username"]').setValue(username)
    wrapper.find('input[name="password"]').setValue(password)
    wrapper.find('.identifyinput input').setValue(wrapper.vm.identifyCode)
    wrapper.find('button').trigger('click')
    await flush()
    await flush()
    expect(mock.history.post).toHaveLength(1)
    expect(received.get('username')).toBe(username)
    expect(received.get('password')).toBe(password)
    expect(Array.from(received.keys())).toEqual(['username', 'password'])
    expect(push).toHaveBeenCalledWith({ path: '/Dashboard/index', query: { userId: 'test-user' }})
  })
})
