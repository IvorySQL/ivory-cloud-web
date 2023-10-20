<template>
  <!--创建备份对话框-->
  <el-dialog
    title="创建备份"
    :visible.sync="backupVisible"
    :close-on-click-modal="false"
    @close="resetForm('backupForm')"
  >
    <el-form ref="backupForm" :model="backupForm" :rules="rules" :label-position="labelPosition">
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
        <el-col :xs="24" :sm="24" :md="20" :lg="12" :xl="8">
          <el-form-item label="备份类型" :label-width="formLabelWidth">
            {{ backupForm.backupType === "PHYSICAL" ? "物理备份" : "逻辑备份" }}
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="24" :md="20" :lg="12" :xl="8">
          <el-form-item label="备份模式" :label-width="formLabelWidth">
            {{ backupForm.backupMode === "FULL" ? "全量备份" : "增量备份" }}
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col style="padding-right: 80px">
          <el-form-item label="备份名称" :label-width="formLabelWidth" prop="name">
            <el-input v-model="backupForm.name" size="small" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col style="padding-right: 80px">
          <el-form-item label="备份描述" :label-width="formLabelWidth" prop="description">
            <el-input v-model="backupForm.description" size="small" type="textarea" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <div slot="footer" class="dialog-footer">
      <el-button type="primary" :loading="isButtonLoading" @click="createBackup('backupForm')">确 定</el-button>
      <el-button @click="backupVisible = false">取 消</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { createBackup, resetForm } from '@/views/CloudNative/Backup/Backup'

export default {
  name: 'BackupDialog',
  props: {
    visible: { type: Boolean, default: false },
    instanceId: { type: String, default: '' },
    instanceName: { type: String, default: '' },
    clusterName: { type: String, default: '' },
    namespace: { type: String, default: '' }
  },
  data() {
    return {
      labelPosition: 'right',
      backupVisible: false,
      rules: {
        name: [
          { required: true, message: '请输入备份名称', trigger: 'blur' }
        ]
      },
      backupForm: {
        name: '',
        description: '',
        backupType: 'PHYSICAL',
        backupMode: ''
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
        this.backupVisible = value
      }
    }
  },
  methods: {
    resetForm,
    createBackup
  }
}
</script>

<style scoped>

</style>
