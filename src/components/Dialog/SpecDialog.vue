<template>
  <!--规格变更对话框-->
  <el-dialog
    title="规格变更"
    :visible.sync="modifySpecVisible"
    :close-on-click-modal="false"
    @close="resetForm('updateForm')"
  >
    <el-form ref="updateForm" :model="updateForm" :rules="rules" :label-position="labelPosition">
      <el-row type="flex" justify="center">
        <el-col>
          <el-form-item>
            <el-descriptions border :size="size">
              <el-descriptions-item label="实例名称">{{ instanceName }}</el-descriptions-item>
              <el-descriptions-item label="所属集群">{{ clusterName }}</el-descriptions-item>
              <el-descriptions-item label="命名空间">{{ namespace }}</el-descriptions-item>
              <el-descriptions-item label="实例ID">{{ instanceId }}</el-descriptions-item>
            </el-descriptions>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :xs="24" :sm="24" :md="24" :lg="12" :xl="8">
          <el-form-item label="CPU数" :label-width="formLabelWidth">
            {{ specificationForm.cpu }} vCPUs
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="24" :md="24" :lg="12" :xl="8">
          <el-form-item label="内存数" :label-width="formLabelWidth">
            {{ specificationForm.memory }} GiB
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :xs="24" :sm="24" :md="24" :lg="12" :xl="8">
          <el-form-item label="变更CPU" :label-width="formLabelWidth" prop="cpu">
            <el-input v-model="updateForm.cpu" size="small">
              <template slot="append">vCPUs</template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="24" :md="24" :lg="12" :xl="8">
          <el-form-item label="变更内存" :label-width="formLabelWidth" prop="memory">
            <el-input v-model="updateForm.memory" size="small">
              <template slot="append">GiB</template>
            </el-input>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <div slot="footer" class="dialog-footer">
      <el-button type="primary" @click="modifySpecs('updateForm')">确 定</el-button>
      <el-button @click="modifySpecVisible = false">取 消</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { resetForm, modifySpecs } from '@/views/CloudNative/DBSpecificationChange/SpecificationChange'
export default {
  name: 'SpecDialog',
  props: {
    visible: { type: Boolean, default: false },
    specificationForm: { type: Object, default: () => ({}) },
    instanceId: { type: String, default: '' },
    instanceName: { type: String, default: '' },
    clusterName: { type: String, default: '' },
    namespace: { type: String, default: '' }
  },
  data() {
    const validateInputCpu = (rules, value, callback) => {
      if (value === '') {
        return callback(new Error('输入信息不能为空！'))
      } else {
        if (value !== '') {
          var reg = /^[0-9]+$/
          if (!reg.test(value)) {
            callback(new Error('只允许输入数字！'))
          }
          if (value < this.specificationForm.cpu) {
            callback(new Error('变更值不能小于原规格！'))
          }
        }
        callback()
      }
    }
    const validateInputMem = (rules, value, callback) => {
      if (value === '') {
        return callback(new Error('输入信息不能为空！'))
      } else {
        if (value !== '') {
          var reg = /^[0-9]+$/
          if (!reg.test(value)) {
            callback(new Error('只允许输入数字！'))
          }
          if (value < this.specificationForm.memory) {
            callback(new Error('变更值不能小于原规格！'))
          }
        }
        callback()
      }
    }
    return {
      updateForm: {
        cpu: '',
        memory: ''
      },
      labelPosition: 'right',
      modifySpecVisible: false,
      rules: {
        cpu: [
          { required: true, validator: validateInputCpu, trigger: 'blur' }
        ],
        memory: [
          { required: true, validator: validateInputMem, trigger: 'blur' }
        ]
      },
      formLabelWidth: '120px',
      size: 'mini',
      isButtonLoading: false
    }
  },
  watch: {
    visible: {
      handler(value) {
        // console.log(value)
        this.modifySpecVisible = value
      }
    }
  },
  methods: {
    resetForm,
    modifySpecs
  }
}
</script>

<style scoped>

</style>
