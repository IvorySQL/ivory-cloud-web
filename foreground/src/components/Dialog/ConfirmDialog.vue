<template>
  <!--创建备份对话框-->
  <el-dialog
    :title="option+'实例'"
    :visible.sync="confirmVisible"
    :close-on-click-modal="false"
    @close="resetConfirm"
  >

    <el-form ref="form" :model="form" :label-position="labelPosition">
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
        <el-col style="padding-right: 80px">
          <el-form-item :label="'此操作将会 ' + option + ' 该数据库实例，是否继续？'" />
        </el-col>
      </el-row>
    </el-form>
    <div slot="footer" class="dialog-footer">
      <el-button type="primary" :loading="isButtonLoading" @click="doOption(option)">确 定</el-button>
      <el-button @click="confirmVisible = false">取 消</el-button>
    </div>
  </el-dialog>
</template>

<script>

import { resetConfirm } from '@/components/MainTable/DBManageButton'
export default {
  name: 'ConfirmDialog',
  props: {
    visible: { type: Boolean, default: false },
    instanceId: { type: String, default: '' },
    instanceName: { type: String, default: '' },
    clusterName: { type: String, default: '' },
    namespace: { type: String, default: '' },
    option: { type: String, default: '' }
  },
  data() {
    return {
      labelPosition: 'right',
      confirmVisible: false,
      dialogTitle: '',
      formLabelWidth: '120px',
      size: 'mini',
      isButtonLoading: false,
      form: {}
    }
  },
  watch: {
    visible: {
      handler(value) {
        // console.log(value)
        this.confirmVisible = value
      }
    }
  },
  methods: {
    resetConfirm,
    doOption(option) {
      const _this = this
      _this.isButtonLoading = true
      // console.log(option);
      if (option === '重启') {
        this.axios.post('/instances/' + _this.instanceId + '/action/restart', {}).then(res => {
          if (res.status === 200) {
            this.$message({
              type: 'success',
              message: '下发指令成功，正在重启中...'
            })
            setTimeout(() => { _this.$parent.getTableList() }, 300)
            _this.confirmVisible = false
          } else {
            this.$message({
              type: 'error',
              message: res.data.message
            })
            _this.isButtonLoading = false
          }
        }).catch(function(error) {
          _this.$message.error(error)
          _this.isButtonLoading = false
        })
      }
      if (option === '删除') {
        this.axios.delete('/instances/' + _this.instanceId, {}).then(res => {
          if (res.status === 200) {
            this.$message({
              type: 'success',
              message: '下发指令成功，正在删除中...'
            })
            setTimeout(() => { _this.$parent.getTableList() }, 300)
            _this.confirmVisible = false
          } else {
            this.$message({
              type: 'error',
              message: res.data.message
            })
            _this.isButtonLoading = false
          }
        }).catch(function(error) {
          _this.$message.error(error)
          _this.isButtonLoading = false
        })
      }
    }
  }
}
</script>

<style scoped>

</style>
