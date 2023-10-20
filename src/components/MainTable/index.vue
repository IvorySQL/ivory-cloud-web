<template>
  <div>
    <s-search-box @resultList="getSearchResult" />
    <el-table
      ref="table"
      v-loading="listLoading"
      element-loading-text="Loading"
      :data="list"
      style="width: 100%;margin-bottom: 20px;"
      border
    >
      <el-table-column align="center" width="55" fixed>
        <!--  eslint-disable-next-line vue/no-unused-vars-->
        <template slot="header" slot-scope="scope">
          <i class="el-icon-s-unfold" />
        </template>
      </el-table-column>
      <el-table-column align="center" label="实例ID" width="110" fixed :show-overflow-tooltip="true">
        <template slot-scope="scope">
          <a class="link-text" @click="handleJump(scope.row)">
            {{ scope.row.id }}</a>
        </template>
      </el-table-column>
      <el-table-column align="center" label="实例名称" width="110" :show-overflow-tooltip="true">
        <template slot-scope="scope">
          {{ scope.row.name }}
        </template>
      </el-table-column>
      <el-table-column class-name="status-col" label="运行状态" align="center" width="130">
        <template slot-scope="scope">
          <el-tag size="medium" :type="(scope.row.status) | statusFilter">
            {{ scope.row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column align="center" label="版本">
        <template slot-scope="scope">{{ scope.row.version }}</template>
      </el-table-column>
      <el-table-column align="center" label="实例类型">
        <template slot-scope="scope">{{ scope.row.type==="ALONE" ? "单节点" : "高可用" }}</template>
      </el-table-column>
      <el-table-column label="命名空间" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.namespace }}</span>
        </template>
      </el-table-column>
      <el-table-column label="存储类型" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.storageClass }}</span>
        </template>
      </el-table-column>
      <el-table-column label="存储空间" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.storage }}</span> GiB
        </template>
      </el-table-column>
      <el-table-column label="规格" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.cpu }}</span> vCPUs<br>
          <span>{{ scope.row.memory }}</span> GiB
        </template>
      </el-table-column>
      <el-table-column align="center" prop="network" label="地址" width="130">
        <template slot-scope="scope">
          <span>
            {{ scope.row.network === null || scope.row.network.size === 0
              ? '' : scope.row.network[0].nodeIp }}
          </span>
        </template>
      </el-table-column>
      <el-table-column align="center" prop="network" label="端口">
        <template slot-scope="scope">
          <span>{{ scope.row.network === null || scope.row.network.size === 0
            ? '' : scope.row.network[0].nodePort }}</span>
        </template>
      </el-table-column>
      <el-table-column align="center" prop="created_at" label="创建时间" width="190">
        <template slot-scope="scope">
          <span>
            {{ scope.row.createdAt }}
          </span>
        </template>
      </el-table-column>
      <el-table-column
        v-if="roleFlag === 'DBManage' && !checkPermission(['admin'])"
        label="操作"
        align="center"
        class-name="small-padding fixed-width"
        width="130"
        fixed="right"
      >
        <!--  eslint-disable-next-line vue/no-unused-vars-->
        <template slot-scope="{row,$index}">
          <el-dropdown style="margin-left: 10px" trigger="click" @command="handleCommand">
            <!--            <el-button size="mini" split-button type="primary" :disabled="row.status!=='RUNNING'">-->
            <el-button size="mini" split-button type="primary">
              更多<i class="el-icon-arrow-down el-icon--right" />
            </el-button>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item
                :command="composeValue('login',row)"
                :disabled="row.status!=='RUNNING'"
              >登录</el-dropdown-item>
              <el-dropdown-item :command="composeValue('restart',row)">重启</el-dropdown-item>
              <el-dropdown-item
                :command="composeValue('backup',row)"
                :disabled="row.status!=='RUNNING'"
              >备份</el-dropdown-item>
              <el-dropdown-item
                :command="composeValue('recovery',row)"
                :disabled="row.status!=='RUNNING'"
              >恢复</el-dropdown-item>
              <el-dropdown-item
                :command="composeValue('monitor',row)"
                :disabled="row.status!=='RUNNING'"
              >监控</el-dropdown-item>
              <el-dropdown-item
                :command="composeValue('expansion',row)"
                :disabled="row.status!=='RUNNING'"
              >磁盘扩容</el-dropdown-item>
              <el-dropdown-item
                :command="composeValue('change',row)"
                :disabled="row.status!=='RUNNING'"
              >规格变更</el-dropdown-item>
              <el-dropdown-item
                :command="composeValue('params',row)"
                :disabled="row.status!=='RUNNING'"
              >参数管理</el-dropdown-item>
              <el-dropdown-item :command="composeValue('delete',row)">删除实例</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </template>
      </el-table-column>
      <el-table-column
        v-if="roleFlag === 'Backup' && !checkPermission(['admin'])"
        label="操作"
        align="center"
        class-name="small-padding fixed-width"
        width="130"
        fixed="right"
      >
        <template slot-scope="scope">
          <el-button
            size="mini"
            split-button
            type="primary"
            :disabled="scope.row.status!=='RUNNING'"
            @click="CallParents(scope.row,roleFlag)"
          >
            备份
          </el-button>
        </template>
      </el-table-column>
      <el-table-column
        v-if="roleFlag === 'Restore' && !checkPermission(['admin'])"
        label="操作"
        align="center"
        class-name="small-padding fixed-width"
        width="130"
        fixed="right"
      >
        <template slot-scope="scope">
          <el-button
            size="mini"
            split-button
            type="primary"
            :disabled="scope.row.status!=='RUNNING'"
            @click="CallParents(scope.row,roleFlag)"
          >
            查看
          </el-button>
        </template>
      </el-table-column>
      <el-table-column
        v-if="roleFlag === 'Expansion' && !checkPermission(['admin'])"
        label="操作"
        align="center"
        class-name="small-padding fixed-width"
        width="130"
        fixed="right"
      >
        <template slot-scope="scope">
          <el-button
            size="mini"
            split-button
            type="primary"
            :disabled="scope.row.status!=='RUNNING'"
            @click="CallParents(scope.row,roleFlag)"
          >
            修改
          </el-button>
        </template>
      </el-table-column>
      <el-table-column
        v-if="roleFlag === 'SpecificationChange' && !checkPermission(['admin'])"
        label="操作"
        align="center"
        class-name="small-padding fixed-width"
        width="130"
        fixed="right"
      >
        <template slot-scope="scope">
          <el-button
            size="mini"
            split-button
            type="primary"
            :disabled="scope.row.status!=='RUNNING'"
            @click="CallParents(scope.row,roleFlag)"
          >
            修改
          </el-button>
        </template>
      </el-table-column>
      <el-table-column
        v-if="roleFlag === 'ParameterModuleManage' && !checkPermission(['admin'])"
        label="操作"
        align="center"
        class-name="small-padding fixed-width"
        width="130"
        fixed="right"
      >
        <template slot-scope="scope">
          <el-button
            size="mini"
            split-button
            type="primary"
            :disabled="scope.row.status!=='RUNNING'"
            @click="CallParents(scope.row,roleFlag)"
          >
            修改
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import checkPermission from '@/utils/permission' // 权限判断函数
import handleCommand from '@/components/MainTable/DBManageButton' // DBManage按钮点击函数
import { composeValue } from '@/components/MainTable/DBManageButton' // DBManage按钮点击函数
import { handleJump } from '@/components/MainTable/DBManageButton' // DBManage按钮点击函数
import SSearchBox from '@/components/SearchBox/index' // 搜索框组件
import getSearchResult from '@/components/SearchBox/getSearchResult' // 搜索功能函数
import { CallParents } from '@/components/MainTable/DBManageButton' // 非数据库管理页面判断调用哪个父组件的对话框

export default {
  name: 'SMainTable',
  components: {
    SSearchBox
  },
  filters: {
    statusFilter(status) {
      if (status.includes('FAILED') || status.includes('ERROR')) {
        return 'danger'
      } else if (status.includes('RUNNING')) {
        return 'success'
      }
    }
  },
  props: {
    // eslint-disable-next-line vue/require-valid-default-prop
    tableList: { type: Array, default: {}},
    // eslint-disable-next-line vue/require-valid-default-prop
    roleFlag: { type: String, default: {}}
  },
  data() {
    return {
      list: [],
      keyword: '',
      listLoading: true,
      clock: '',
      userId: ''
    }
  },
  watch: {
    // tableList: {
    //   handler(oldVal,newVal){
    //     console.log(newVal[0].status)
    //     this.list = newVal
    //   }
    // },
    tableList: {
      handler(value) {
        // console.log(value[0].status)
        this.list = value
      }
    }
  },
  created() {
    this.list = this.tableList
    this.$nextTick(() => {
      var _this = this
      _this.$refs.table.doLayout()
    })
    window.setTimeout(() => {
      this.listLoading = false
    }, 150)
  },
  methods: {
    composeValue,
    handleCommand,
    handleJump,
    checkPermission,
    getSearchResult,
    CallParents
  }
}
</script>

<style scoped>

</style>
