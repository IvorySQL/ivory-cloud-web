import Vue from 'vue'
import VueRouter from 'vue-router'
import { createLocalVue, mount } from '@vue/test-utils'
import ElementUI from 'element-ui'
import AppMain from '@/layout/components/AppMain.vue'
import ModifyPassword from '@/views/Common/modifyPassword/index.vue'

const flush = () => new Promise(resolve => setImmediate(resolve))

describe('password reset confirmation range on DOM blur', () => {
  let wrapper
  beforeEach(async() => {
    const localVue = createLocalVue()
    localVue.use(ElementUI)
    localVue.use(VueRouter)
    const router = new VueRouter({
      mode: 'abstract',
      routes: [{ path: '/modifyPassword', component: ModifyPassword }]
    })
    router.push({ path: '/modifyPassword', query: { username: 'userabc' }})
    wrapper = mount(AppMain, { localVue, router, stubs: ['svg-icon'] })
    await Vue.nextTick()
  })
  afterEach(() => {
    if (wrapper) wrapper.destroy()
  })

  async function blurConfirmation(password, confirmation) {
    await wrapper.find('input[name="password"]').setValue(password)
    await wrapper.find('input[name="confirmpass"]').setValue(confirmation)
    await wrapper.find('input[name="confirmpass"]').trigger('blur')
    await flush()
    await Vue.nextTick()
    return wrapper.findAll({ name: 'ElFormItem' }).wrappers
      .find(item => item.vm.prop === 'confirmpass')
  }

  it('shows the existing range error for matching 17-character values', async() => {
    const field = await blurConfirmation('a'.repeat(17), 'a'.repeat(17))
    expect(field.classes()).toContain('is-error')
    expect(field.text()).toContain('长度在6到16个字符之间！')
  })

  it('accepts matching values at the lower boundary', async() => {
    const field = await blurConfirmation('a'.repeat(6), 'a'.repeat(6))
    expect(field.vm.validateState).toBe('success')
  })

  it('accepts matching values at the upper boundary', async() => {
    const field = await blurConfirmation('a'.repeat(16), 'a'.repeat(16))
    expect(field.vm.validateState).toBe('success')
  })

  it('retains the existing mismatch error', async() => {
    const field = await blurConfirmation('password1', 'password2')
    expect(field.classes()).toContain('is-error')
    expect(field.text()).toContain('密码与确认密码不一致！')
  })
})
