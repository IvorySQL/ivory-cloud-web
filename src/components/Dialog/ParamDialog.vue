<template>
  <!--修改参数对话框-->
  <el-dialog
    title="参数列表"
    :visible.sync="modifyParamsVisible"
    :close-on-click-modal="false"
    @close="resetInput()"
  >
    <el-descriptions border :size="size">
      <el-descriptions-item label="实例名称">{{ instanceName }}</el-descriptions-item>
      <el-descriptions-item label="所属集群">{{ clusterName }}</el-descriptions-item>
      <el-descriptions-item label="命名空间">{{ namespace }}</el-descriptions-item>
      <el-descriptions-item label="实例ID">{{ instanceId }}</el-descriptions-item>
    </el-descriptions>
    <el-table :data="parameterList" max-height="250" height="250">
      <el-table-column property="name" label="参数名" width="200" :show-overflow-tooltip="true" fixed>
        <template slot-scope="scope">
          {{ scope.row.name }}
        </template>
      </el-table-column>
      <el-table-column property="description" label="" width="35" align="center" fixed>
        <template slot-scope="scope">
          <el-tooltip class="restoreHelp" effect="dark">
            <div slot="content">
              {{ scope.row.description }}
            </div>
            <i class="el-icon-question" />
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column property="defaultValue" label="默认值" fix align="center">
        <template slot-scope="scope">
          {{ scope.row.defaultValue }}
        </template>
      </el-table-column>
      <el-table-column property="runningValue" label="运行值" fix align="center">
        <template slot-scope="scope">
          {{ scope.row.runningValue }}
        </template>
      </el-table-column>
      <el-table-column property="targetValue" label="可修改值" fix align="center">
        <template slot-scope="scope">
          <div v-if="!scope.row.isEdit">
            <!--               <div v-if="scope.row.targetValue === '' || scope.row.targetValue == null">-->
            <div v-if="scope.row.targetValue === '' || scope.row.targetValue == null">
              <!--判断传入参数类型-->
              <div v-if="scope.row.paramType === 'ENUM'">
                {{ scope.row.enumValue }}
              </div>
              <div v-if="scope.row.paramType === 'VARCHAR'">
                [{{ scope.row.min }}MB-{{ scope.row.max }}MB]
              </div>
              <div v-if="scope.row.paramType === 'INTEGER'">
                [{{ scope.row.min }}-{{ scope.row.max }}]
              </div>
            </div>
            <div v-else>
              {{ scope.row.targetValue }}
            </div>
          </div>
          <div v-else>
            <el-input v-model="scope.row.targetValue" size="mini" :placeholder="placeholder" />
          </div>
        </template>
      </el-table-column>
      <el-table-column property="edit" label="操作" width="70" align="center" fixed="right">
        <template slot-scope="scope">
          <el-button size="mini" type="text" @click="handleClick(scope.row)">
            {{ scope.row.isEdit ? '保存' : '编辑' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!--      <span style="float: right">-->
    <!--        <div style="margin-top: 10px">-->
    <!--          <el-button @click="getParamHistory()" type="text" size="mini">修改历史</el-button>-->
    <!--        </div>-->
    <!--      </span>-->

    <div slot="footer" class="dialog-footer">
      <el-button type="primary" @click="modifyParams()">确 定</el-button>
      <el-button @click="modifyParamsVisible = false">取 消</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { resetInput, modifyParams, validateInput, handleClick, getPlaceholder } from '@/views/CloudNative/ParameterModuleManage/Parameter'
export default {
  name: 'ParamDialog',
  props: {
    visible: { type: Boolean, default: false },
    tableList: { type: Array, default: () => [] },
    instanceId: { type: String, default: '' },
    instanceName: { type: String, default: '' },
    clusterName: { type: String, default: '' },
    namespace: { type: String, default: '' }
  },
  data() {
    return {
      modifyParamsVisible: false,
      parameterList: [],
      formLabelWidth: '120px',
      labelPosition: 'right',
      updateParams: [],
      allowCommit: false,
      newParam: '',
      size: 'mini',
      placeholder: ''
    }
  },
  watch: {
    visible: {
      handler(value) {
        // console.log(value)
        this.modifyParamsVisible = value
      }
    },
    tableList: {
      handler(value) {
        // console.log(value)
        this.parameterList = value
      }
    }
  },
  methods: {
    resetInput,
    modifyParams,
    handleClick,
    validateInput,
    getPlaceholder
  }
}
</script>

<style scoped>

</style>
