import { createLocalVue, mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import ElementUI from 'element-ui'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import AppMain from '@/layout/components/AppMain.vue'
import SvgIcon from '@/components/SvgIcon/index.vue'
import OwnerCenter from '@/views/Common/OwnerCenter/index.vue'

async function flush() {
  for (let index = 0; index < 6; index++) {
    await new Promise(resolve => setTimeout(resolve, 0))
  }
}

describe('OwnerCenter confirmation eye focus', () => {
  let wrapper
  let host
  let transport

  afterEach(async() => {
    if (wrapper) wrapper.destroy()
    wrapper = null
    if (host && host.parentNode) host.parentNode.removeChild(host)
    host = null
    if (transport) transport.restore()
    transport = null
    await flush()
  })

  it('keeps the confirmation input focused across both real eye clicks', async() => {
    const localVue = createLocalVue()
    localVue.use(VueRouter)
    localVue.use(ElementUI)
    localVue.component('svg-icon', SvgIcon)
    const errors = []
    localVue.config.errorHandler = (error, vm, info) => errors.push({ error, info })
    const client = axios.create()
    localVue.prototype.axios = client
    transport = new MockAdapter(client)
    // Mount the actual registered leaf at its current complete route path.
    // Parent Layout/permission guard are proven by source, not simulated here.
    const router = new VueRouter({
      mode: 'abstract',
      routes: [{ path: '/OwnerCenter/index', component: OwnerCenter }]
    })
    await router.push('/OwnerCenter/index')
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
    const page = wrapper.find(OwnerCenter)
    expect(page.exists()).toBe(true)
    const password = 'Testpass1!'
    await page.find('input[name="password"]').setValue(password)
    await page.find('input[name="confirmpass"]').setValue(password)
    await flush()
    const field = page.findAll({ name: 'ElFormItem' }).wrappers
      .find(item => item.props('prop') === 'confirmpass')
    expect(field).toBeDefined()
    expect(field.find('input').element.type).toBe('password')

    for (const type of ['text', 'password']) {
      page.find('input[name="username"]').element.focus()
      expect(document.activeElement).toBe(page.find('input[name="username"]').element)
      await field.find('.show-pwd').trigger('click')
      await flush()
      const input = page.find('input[name="confirmpass"]')
      expect(input.element.type).toBe(type)
      expect(input.element.value).toBe(password)
      expect(errors).toEqual([])
      expect(document.activeElement).toBe(input.element)
      expect(page.find('input[name="password"]').element.type).toBe('password')
      expect(page.find('input[name="password"]').element.value).toBe(password)
    }

    expect(router.currentRoute.path).toBe('/OwnerCenter/index')
    expect(transport.history.post).toHaveLength(0)
    expect(transport.history.get).toHaveLength(0)
  })
})

