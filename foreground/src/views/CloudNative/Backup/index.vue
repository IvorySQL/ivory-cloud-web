<template>
  <div class="app-container">
    <s-main-table
      v-if="list&&flag"
      :table-list="list"
      :role-flag="roleFlag"
      @TimerContinue="TimerContinue"
    />
    <backup-dialog
      :visible.sync="backupVisible"
      :instance-id.sync="instanceId"
      :instance-name.sync="instanceName"
      :cluster-name.sync="clusterName"
      :namespace.sync="namespace"
    />
  </div>
</template>

<script>
import checkPermission from '@/utils/permission'
import SMainTable from '@/components/MainTable/index' // 主页面表格
import BackupDialog from '@/components/Dialog/BackupDialog' // 备份对话框
import TimerContinue from '@/components/MainTable/TimerContinue' // 重置计时器
import { AddChecked, getTableList, getTableList2, setTimer } from '@/components/MainTable/setTimer' // 计时器
import { getBackupInfo } from '@/views/CloudNative/Backup/Backup'

export default {
  components: {
    SMainTable,
    BackupDialog
  },
  data() {
    return {
      list: [],
      keyword: '',
      listLoading: true,
      clock: '',
      userId: '',
      backupVisible: false,
      instanceId: '',
      instanceName: '',
      clusterName: '',
      namespace: '',
      rules: {
        name: [
          { required: true, message: '请输入备份名称', trigger: 'blur' }
        ]
      },
      backupForm: {
        name: '',
        description: '',
        backupType: 'PHYSICAL',
        backupMode: 'FULL'
      },
      flag: false,
      roleFlag: 'Backup'
    }
  },
  mounted() {
    var userId = localStorage.getItem('userId')
    if (!userId) {
      userId = localStorage.getItem('userId')
    }
    this.userId = userId
    this.getTableList()
    this.setTimer()
  },
  beforeDestroy() {
    var _this = this
    window.clearInterval(_this.clock)
    _this.clock = null
  },
  methods: {
    TimerContinue,
    getBackupInfo,
    setTimer,
    getTableList,
    getTableList2,
    AddChecked,
    checkPermission
  }
}
</script>

<style lang="scss">
.link-text {
  color: #409eff;
}

.el-table .warning-row {
  background: rgba(255, 255, 0, 0.1);
}

.el-table .success-row {
  background: #f0f9eb;
}

.el-dialog__body {
  padding: 30px 20px 50px;
}
</style>
