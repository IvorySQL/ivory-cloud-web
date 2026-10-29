import { createLocalVue, mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import ElementUI from 'element-ui'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import AppMain from '@/layout/components/AppMain.vue'
import SvgIcon from '@/components/SvgIcon/index.vue'
import Register from '@/views/Common/register/index.vue'
import ModifyPassword from '@/views/Common/modifyPassword/index.vue'

async function flush() {
  for (let index = 0; index < 6; index++) {
    await new Promise(resolve => setTimeout(resolve, 0))
  }
}

describe('routed password eyes retain their own real input focus', () => {
  let wrapper
  let host
  let transport
  let errors
  const password = 'Testpass1!'

  afterEach(async() => {
    if (wrapper) wrapper.destroy()
    wrapper = null
    if (host && host.parentNode) host.parentNode.removeChild(host)
    host = null
    if (transport) transport.restore()
    transport = null
    await flush()
  })

  async function openPage(path, component) {
    const localVue = createLocalVue()
    localVue.use(VueRouter)
    localVue.use(ElementUI)
    localVue.component('svg-icon', SvgIcon)
    errors = []
    localVue.config.errorHandler = (error, vm, info) => errors.push({ error, info })
    const client = axios.create()
    localVue.prototype.axios = client
    transport = new MockAdapter(client)
    const router = new VueRouter({
      mode: 'abstract',
      routes: [
        { path: '/register', component: Register },
        { path: '/modifyPassword', component: ModifyPassword }
      ]
    })
    await router.push({ path, query: { username: 'routine_demo' }})
    host = document.createElement('div')
    document.body.appendChild(host)
    wrapper = mount(AppMain, {
      localVue,
      router,
      attachTo: host,
      sync: false,
      stubs: { transition: false, 'transition-group': false }
    })
    await flush()
    const page = wrapper.find(component)
    expect(page.exists()).toBe(true)
    await page.find('input[name="password"]').setValue(password)
    await page.find('input[name="confirmpass"]').setValue(password)
    await flush()
    return { page, router }
  }

  const cases = [
    { path: '/register', component: Register, field: 'confirmpass' },
    { path: '/register', component: Register, field: 'password' },
    { path: '/modifyPassword', component: ModifyPassword, field: 'confirmpass' },
    { path: '/modifyPassword', component: ModifyPassword, field: 'password' }
  ]

  cases.forEach(({ path, component, field }) => {
    it(path + ' toggles and focuses ' + field + ' without a Vue error', async() => {
      const { page, router } = await openPage(path, component)
      const other = field === 'password' ? 'confirmpass' : 'password'
      const formItem = page.findAll({ name: 'ElFormItem' }).wrappers
        .find(item => item.props('prop') === field)
      expect(formItem).toBeDefined()
      expect(formItem.find('input').element.type).toBe('password')

      // The real key-driven ElInput replacement must regain focus after each
      // DOM eye click. No component/ref/method or focus implementation is replaced.
      for (const type of ['text', 'password']) {
        page.find('input[name="username"]').element.focus()
        expect(document.activeElement).toBe(page.find('input[name="username"]').element)
        await formItem.find('.show-pwd').trigger('click')
        await flush()

        const input = page.find('input[name="' + field + '"]')
        expect(input.element.type).toBe(type)
        expect(input.element.value).toBe(password)
        expect(document.activeElement).toBe(input.element)
        expect(page.find('input[name="' + other + '"]').element.type).toBe('password')
        expect(page.find('input[name="' + other + '"]').element.value).toBe(password)
        expect(errors).toEqual([])
      }

      expect(router.currentRoute.path).toBe(path)
      expect(transport.history.post).toHaveLength(0)
      expect(transport.history.get).toHaveLength(0)
    })
  })
})

