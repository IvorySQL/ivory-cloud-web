<template>
  <!--备份列表对话框-->
  <el-dialog
    title="备份文件"
    :visible.sync="restoreVisible"
    :close-on-click-modal="false"
    @close="resetTable"
  >
    <el-descriptions border :size="size">
      <el-descriptions-item label="实例名称">{{ instanceName }}</el-descriptions-item>
      <el-descriptions-item label="所属集群">{{ clusterName }}</el-descriptions-item>
      <el-descriptions-item label="命名空间">{{ namespace }}</el-descriptions-item>
      <el-descriptions-item label="实例ID">{{ instanceId }}</el-descriptions-item>
    </el-descriptions>
    <el-table :data="backupLists" max-height="250" height="250">
      <el-table-column property="name" label="备份名称" :show-overflow-tooltip="true" align="center" fixed>
        <template slot-scope="scope">
          {{ scope.row.name }}
        </template>
      </el-table-column>
      <el-table-column property="description" label="备份描述" :show-overflow-tooltip="true" align="center">
        <template slot-scope="scope">
          {{ scope.row.description }}
        </template>
      </el-table-column>
      <el-table-column property="status" label="状态" align="center" width="120">
        <template slot-scope="scope">
          <el-tag size="medium" :type="(scope.row.status) | statusFilter">
            {{ scope.row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column property="backupType" label="备份类型" width="90" align="center">
        <template slot-scope="scope">
          {{ scope.row.backupType === 'PHYSICAL' ? '物理' : '逻辑' }}
        </template>
      </el-table-column>
      <el-table-column property="backupMode" label="备份模式" width="80" align="center">
        <template slot-scope="scope">
          {{ scope.row.backupMode === 'FULL' ? '全量' : '增量' }}
        </template>
      </el-table-column>
      <el-table-column property="backupMethod" label="备份策略" width="80" align="center">
        <template slot-scope="scope">
          {{ scope.row.backupMethod === 'MANUAL' ? '手动' : '自动' }}
        </template>
      </el-table-column>

      <el-table-column property="isRestoring" label="恢复中" width="100" align="center">
        <template slot-scope="scope">
          {{ scope.row.isRestoring === 'true' ? '是' : '否' }}
        </template>
      </el-table-column>
      <el-table-column property="createdAt" label="创建时间" width="160" align="center">
        <template slot-scope="scope">
          {{ scope.row.createdAt }}
        </template>
      </el-table-column>
      <el-table-column property="lastRecoveryTime" label="上次恢复时间" width="160" align="center">
        <template slot-scope="scope">
          {{ scope.row.lastRecoveryTime }}
        </template>
      </el-table-column>

      <el-table-column property="recovery" label="操作" width="70" fixed="right">
        <template slot-scope="scope">
          <el-button size="mini" type="text" @click="recovery(scope.row)">
            恢复
          </el-button>
        </template>
      </el-table-column>

    </el-table>
    <div slot="footer" class="dialog-footer">
      <el-button @click="restoreVisible = false">取 消</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { recovery, resetTable } from '@/views/CloudNative/Restore/Restore'
export default {
  name: 'RestoreDialog',
  filters: {
    statusFilter(status) {
      const statusMap = new Map()
      statusMap.set('RUNNING', 'success')
      statusMap.set('PROCESSING', 'gray')
      statusMap.set('FAILED', 'danger')
      statusMap.set('ERROR', 'danger')
      statusMap.set('COMPLETED', 'success')
      statusMap.set('RESTORED', 'success')
      return statusMap.get(status)
    }
  },
  props: {
    visible: { type: Boolean, default: false },
    instanceId: { type: String, default: '' },
    instanceName: { type: String, default: '' },
    clusterName: { type: String, default: '' },
    backupLists: { type: Array, default: () => [] },
    clusterId: { type: String, default: '' },
    namespace: { type: String, default: '' }
  },
  data() {
    return {
      labelPosition: 'right',
      loading: false,
      list: [],
      keyword: '',
      listLoading: true,
      clock: '',
      userId: '',
      restoreVisible: false,
      restoreForm: {
        isRestore: true,
        originalInstanceId: '',
        originalBackupId: '',
        clusterId: ''
      },
      formLabelWidth: '120px',
      isRestore: true,
      flag: false,
      size: 'mini'
    }
  },
  watch: {
    visible: {
      handler(value) {
        // console.log(value)
        this.restoreVisible = value
      }
    }
  },
  methods: {
    recovery,
    resetTable
  }
}
</script>

<style scoped>

</style>
