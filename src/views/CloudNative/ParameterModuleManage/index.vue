<template>
  <div class="app-container">
    <s-main-table
      v-if="list&&flag"
      :table-list="list"
      :role-flag="roleFlag"
      @TimerContinue="TimerContinue"
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
import checkPermission from '@/utils/permission'
import SMainTable from '@/components/MainTable/index' // 主页面表格
import ParamDialog from '@/components/Dialog/ParamDialog' // 参数管理对话框
import TimerContinue from '@/components/MainTable/TimerContinue' // 重置计时器
import { AddChecked, getTableList, getTableList2, setTimer } from '@/components/MainTable/setTimer'
import { getParamLists } from '@/views/CloudNative/ParameterModuleManage/Parameter'

export default {
  components: {
    ParamDialog,
    SMainTable
  },
  data() {
    return {
      list: [],
      keyword: '',
      listLoading: true,
      clock: '',
      userId: '',
      modifyParamsVisible: false,
      parameterList: [],
      instanceId: '',
      instanceName: '',
      clusterName: '',
      namespace: '',
      historyList: [],
      historyForm: {
        createTime: '',
        paramName: '',
        sourceValue: '',
        targetValue: ''
      },
      flag: false,
      roleFlag: 'ParameterModuleManage'
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
    setTimer,
    getTableList,
    getTableList2,
    AddChecked,
    getParamLists,
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
