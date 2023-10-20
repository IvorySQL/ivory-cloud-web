<template>
  <div class="app-container">
    <s-main-table
      v-if="list&&flag"
      :table-list="list"
      :role-flag="roleFlag"
      @TimerContinue="TimerContinue"
    />
    <restore-dialog
      :visible.sync="restoreVisible"
      :instance-id.sync="instanceId"
      :instance-name.sync="instanceName"
      :cluster-name.sync="clusterName"
      :backup-lists.sync="backupLists"
      :cluster-id="clusterId"
      :namespace.sync="namespace"
    />
  </div>
</template>

<script>
import checkPermission from '@/utils/permission'
import SMainTable from '@/components/MainTable/index' // 主页面表格
import RestoreDialog from '@/components/Dialog/RestoreDialog' // 恢复对话框
import TimerContinue from '@/components/MainTable/TimerContinue' // 重置计时器
import { AddChecked, getTableList, getTableList2, setTimer } from '@/components/MainTable/setTimer' // 计时器
import { getBackupLists } from '@/views/CloudNative/Restore/Restore'

export default {
  components: {
    SMainTable,
    RestoreDialog
  },
  data() {
    return {
      list: [],
      keyword: '',
      listLoading: true,
      clock: '',
      userId: '',
      restoreVisible: false,
      instanceId: '',
      instanceName: '',
      clusterName: '',
      namespace: '',
      clusterId: '',
      backupLists: [],
      flag: false,
      roleFlag: 'Restore'
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
    getBackupLists,
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
