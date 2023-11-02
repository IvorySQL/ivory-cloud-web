import {createLocalVue, mount, shallowMount} from '@vue/test-utils'
import ElementUI from 'element-ui'
import DBInstance from '@/views/CloudNative/DBInstance/index'
import SvgIcon from '@/components/SvgIcon/index'
import axios from "axios"
import MockAdapter from "axios-mock-adapter"
import VueRouter from "vue-router"


const localVue = createLocalVue()
localVue.use(ElementUI)
localVue.use(VueRouter)
localVue.prototype.axios = axios

// 模拟axios
const mockAxios = new MockAdapter(axios)

describe('DBInstance.vue', () => {
  // 将mounted钩子替换为空函数
  DBInstance.mounted = jest.fn()

  it('获取集群信息',  async () => {
    const wrapper = shallowMount(DBInstance, {
      localVue,
      stubs: ['SvgIcon']
    })
    // 模拟axios的返回值
    mockAxios.onGet('/clusters').reply(200,[{
        "clusterId": "ef9d1dcfe80f440b9fa67a7ef2fcd30b",
        "clusterName": "k8s"
      }]
    )
    wrapper.vm.getCluster()
    // 更新DOM
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.form.clusterId).toEqual('ef9d1dcfe80f440b9fa67a7ef2fcd30b')
    expect(wrapper.vm.form.clusterName).toEqual('k8s')
  })

  it('选择集群', async () => {
    const wrapper = shallowMount(DBInstance, {
      localVue,
      stubs: ['SvgIcon']
    })
    // 预置数据
    wrapper.vm.Cluster = [{
      "clusterId": "ef9d1dcfe80f440b9fa67a7ef2fcd30b",
      "clusterName": "k8s"
    }]
    wrapper.vm.form.clusterName = 'k8s'
    const select = wrapper.find({ref: 'clusterName'})
    select.vm.$emit('change', 'k8s')
    await wrapper.vm.$nextTick()
    // 检查是否更新
    expect(wrapper.vm.form.clusterId).toEqual('ef9d1dcfe80f440b9fa67a7ef2fcd30b')
  })

  it('获取命名空间', async () => {
    const wrapper = shallowMount(DBInstance, {
      localVue,
      stubs: ['SvgIcon']
    })
    mockAxios.onGet('/clusters/ef9d1dcfe80f440b9fa67a7ef2fcd30b/namespace').reply(200,[
      { "metadata": { "name": "highgo" } }
    ])
    wrapper.vm.form.clusterId = 'ef9d1dcfe80f440b9fa67a7ef2fcd30b'
    wrapper.vm.getNamespace()
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.Namespace[0].metadata.name).toEqual('highgo')
  })

  it('选择命名空间', async () => {
    const wrapper = shallowMount(DBInstance, {
      localVue,
      stubs: ['SvgIcon']
    })
    wrapper.vm.Namespace = [
      { "metadata": { "uid": "1", "name": "highgo" } }
    ]
    const select = wrapper.find({ref: 'namespace'})
    // select.vm.$emit('click', '1')
    select.vm.$emit('input', 'highgo')
    // 检查是否更新
    expect(wrapper.vm.form.namespace).toEqual('highgo')
  })

  it('选择实例类型',async () => {
    const wrapper = shallowMount(DBInstance, {
      localVue,
      stubs: ['SvgIcon']
    })
    const radio = wrapper.find({ref: 'typeChange'})
    radio.vm.$emit('input', 2)
    radio.vm.$emit('change')
    expect(wrapper.vm.form.nodenum).toEqual('3')
    expect(wrapper.vm.form.typeName).toEqual('高可用')
  })

  it('获取存储类型',async () => {
    const wrapper = shallowMount(DBInstance, {
      localVue,
      stubs: ['SvgIcon']
    })

    mockAxios.onGet('/storage-class').reply(200,[{
        "metadata": {"name": "highgo"}
      }])
    wrapper.vm.getStorageClass()
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.form.storageClass).toEqual('highgo')
  })

  it('选择存储类型', () => {
    const wrapper = shallowMount(DBInstance, {
      localVue,
      stubs: ['SvgIcon']
    })
    wrapper.vm.Namespace = [
      { "metadata": { "uid": "1", "name": "highgo" } }
    ]
    const select = wrapper.find({ref: 'storageClass'})
    select.vm.$emit('input', 'highgo')
    expect(wrapper.vm.form.storageClass).toBe('highgo')
  })

  it('下一步', async () => {
    const wrapper = shallowMount(DBInstance, {
      localVue,
      stubs: ['SvgIcon']
    })
    const elForm = wrapper.find({ref: 'form'});
    expect(elForm.exists()).toBe(true);

    elForm.vm.$emit('validate', true)
    wrapper.vm.onSubmit('form')
  })
})
