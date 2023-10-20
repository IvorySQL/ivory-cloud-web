<template>
  <!--磁盘扩容对话框-->
  <el-dialog
    title="磁盘扩容"
    :visible.sync="storageExpansionVisible"
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
          <el-form-item label="磁盘空间" :label-width="formLabelWidth">
            {{ storageForm.storage }} GiB
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :xs="24" :sm="24" :md="24" :lg="12" :xl="8">
          <el-form-item label="磁盘空间扩容" :label-width="formLabelWidth" prop="storage">
            <el-input v-model="updateForm.storage" size="small">
              <template slot="append">GiB</template>
            </el-input>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <div slot="footer" class="dialog-footer">
      <el-button type="primary" @click="expandStorage('updateForm')">确 定</el-button>
      <el-button @click="storageExpansionVisible = false">取 消</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { resetForm, expandStorage } from '@/views/CloudNative/DBExpansion/Expansion'
export default {
  name: 'ExpansionDialog',
  props: {
    visible: { type: Boolean, default: false },
    storageForm: { type: Object, default: () => ({}) },
    instanceId: { type: String, default: '' },
    instanceName: { type: String, default: '' },
    clusterName: { type: String, default: '' },
    namespace: { type: String, default: '' }
  },
  data() {
    const validateInputStorage = (rules, value, callback) => {
      if (value === '') {
        return callback(new Error('输入信息不能为空！'))
      } else {
        if (value !== '') {
          var reg = /^[0-9]+$/
          if (!reg.test(value)) {
            callback(new Error('只允许输入数字！'))
          }
          if (value < this.storageForm.storage) {
            callback(new Error('变更值不能小于原规格！'))
          }
        }
        callback()
      }
    }
    return {
      updateForm: { storage: '' },
      formLabelWidth: '120px',
      labelPosition: 'right',
      rules: {
        storage: [
          { required: true, validator: validateInputStorage, trigger: 'blur' }
        ]
      },
      storageExpansionVisible: false,
      size: 'mini',
      isButtonLoading: false
    }
  },
  watch: {
    visible: {
      handler(value) {
        // console.log(value)
        this.storageExpansionVisible = value
      }
    }
  },
  methods: {
    resetForm,
    expandStorage
  }
}
</script>

<style scoped>

</style>
