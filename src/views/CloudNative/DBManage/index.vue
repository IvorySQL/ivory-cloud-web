<template>
  <div class="app-container">
    <s-main-table
      v-if="list&&flag"
      :table-list="list"
      :role-flag="roleFlag"
      @TimerContinue="TimerContinue"
    />
    <confirm-dialog
      :visible.sync="confirmVisible"
      :instance-id.sync="instanceId"
      :instance-name.sync="instanceName"
      :cluster-name.sync="clusterName"
      :namespace.sync="namespace"
      :option="option"
    />
    <backup-dialog
      :visible.sync="backupVisible"
      :instance-id.sync="instanceId"
      :instance-name.sync="instanceName"
      :cluster-name.sync="clusterName"
      :namespace.sync="namespace"
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
    <expansion-dialog
      :visible.sync="storageExpansionVisible"
      :storage-form="storageForm"
      :instance-id.sync="instanceId"
      :instance-name.sync="instanceName"
      :cluster-name.sync="clusterName"
      :namespace.sync="namespace"
    />
    <spec-dialog
      :visible.sync="modifySpecVisible"
      :specification-form="specificationForm"
      :instance-id.sync="instanceId"
      :instance-name.sync="instanceName"
      :cluster-name.sync="clusterName"
      :namespace.sync="namespace"
    />
    <param-dialog
      :table-list="parameterList"
      :visible.sync="modifyParamsVisible"
      :instance-id.sync="instanceId"
      :instance-name.sync="instanceName"
      :cluster-name.sync="clusterName"
      :namespace.sync="namespace"
    />
  </div>
</template>

<script>
import checkPermission from '@/utils/permission' // 权限判断函数
import SMainTable from '@/components/MainTable/index' // 主页面表格
import ConfirmDialog from '@/components/Dialog/ConfirmDialog'
import BackupDialog from '@/components/Dialog/BackupDialog' // 备份对话框
import RestoreDialog from '@/components/Dialog/RestoreDialog' // 恢复对话框
import ExpansionDialog from '@/components/Dialog/ExpansionDialog' // 磁盘扩容对话框
import SpecDialog from '@/components/Dialog/SpecDialog' // 变更规格对话框
import ParamDialog from '@/components/Dialog/ParamDialog' // 参数修改对话框
import TimerContinue from '@/components/MainTable/TimerContinue' // 重置计时器
import { AddChecked, getTableList, getTableList2, setTimer } from '@/components/MainTable/setTimer' // 计时器
import { getConfirmInfo } from '@/components/MainTable/DBManageButton'
import { getBackupInfo } from '@/views/CloudNative/Backup/Backup'
import { getBackupLists } from '@/views/CloudNative/Restore/Restore'
import { getStorageInfo } from '@/views/CloudNative/DBExpansion/Expansion'
import { getSpecInfos } from '@/views/CloudNative/DBSpecificationChange/SpecificationChange'
import { getParamLists } from '@/views/CloudNative/ParameterModuleManage/Parameter'

export default {
  components: { SMainTable, BackupDialog, RestoreDialog, ExpansionDialog, SpecDialog, ParamDialog, ConfirmDialog },
  data() {
    return {
      list: [],
      cluster: '',
      keyword: '',
      listLoading: true,
      clock: '',
      userId: '',
      flag: false,
      roleFlag: 'DBManage',
      confirmVisible: false,
      option: '',
      backupVisible: false,
      restoreVisible: false,
      instanceId: '',
      instanceName: '',
      clusterName: '',
      namespace: '',
      clusterId: '',
      backupLists: [],
      storageExpansionVisible: false,
      storageForm: { storage: '' },
      modifySpecVisible: false,
      specificationForm: {
        cpu: '',
        memory: ''
      },
      modifyParamsVisible: false,
      parameterList: []
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
    _this.roleFlag = ''
  },
  methods: {
    checkPermission,
    setTimer,
    getTableList,
    getTableList2,
    AddChecked,
    TimerContinue,
    getConfirmInfo,
    getBackupInfo,
    getBackupLists,
    getStorageInfo,
    getSpecInfos,
    getParamLists
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
