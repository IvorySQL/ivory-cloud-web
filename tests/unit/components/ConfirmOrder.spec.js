import {createLocalVue, shallowMount} from '@vue/test-utils'
import ElementUI from 'element-ui'
import VueRouter from 'vue-router'
import axios from "axios";
import MockAdapter from "axios-mock-adapter"
import ConfirmOrder from "@/views/CloudNative/ConfirmOrder/index"

const routes = [
  {
    path: '/nativeCloud/DBManage/index'
  },
  {
    path: '/nativeCloud/DBInstance/index'
  }
]

const localVue = new createLocalVue()
localVue.use(ElementUI)
localVue.use(VueRouter)
localVue.prototype.axios = axios

const mockAxios = new MockAdapter(axios)

describe('ConfirmOrder.vue', () => {
  ConfirmOrder.mounted = jest.fn()

  it('创建新实例成功', async () => {
    const router = new VueRouter({ routes })
    const wrapper = shallowMount(ConfirmOrder, {
      localVue,
      router
    })
    mockAxios.onPost('/instances').reply(200,{
      "status": "CREATING"
    })
    wrapper.vm.onSubmit()
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.loading).toEqual(false)
    expect(wrapper.vm.$route.path).toEqual('/nativeCloud/DBManage/index')
  })

  it('创建新实例失败', async () => {
    const router = new VueRouter({ routes })
    const wrapper = shallowMount(ConfirmOrder, {
      localVue,
      router
    })
    mockAxios.onPost('/instances').reply(200,{
      "status": "failed"
    })
    wrapper.vm.onSubmit()
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.loading).toEqual(false)
    expect(wrapper.vm.$route.path).toEqual('/nativeCloud/DBInstance/index')
  })

  it('上一步', async () => {
    const router = new VueRouter({ routes })
    const wrapper = shallowMount(ConfirmOrder, {
      localVue,
      router
    })
    wrapper.vm.onCancel()
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.$route.path).toEqual('/nativeCloud/DBInstance/index')
  })
})

