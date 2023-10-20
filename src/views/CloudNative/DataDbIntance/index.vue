<template>
  <div class="app-container">
    <el-table
      ref="table"
      v-loading="listLoading"
      element-loading-text="Loading"
      :data="list"
      style="width: 100%;margin-bottom: 20px;"
      row-key="dcId"
      border
      :tree-props="{children: 'children', hasChildren: 'hasChildren'}"
    >
      <el-table-column align="center" width="55">
        <!--  eslint-disable-next-line vue/no-unused-vars-->
        <template slot="header" slot-scope="scope">
          <i class="el-icon-s-unfold" />
        </template>
        <!--        <template slot-scope="scope">-->
        <!--          <el-checkbox v-model="scope.row.checked"-->
        <!--                       @change="handleCheckedOne(scope.row)"/>-->
        <!--        </template>-->
      </el-table-column>
      <el-table-column align="center" prop="created_at" label="公网地址" width="130">
        <template slot-scope="scope">
          <span>
            {{ scope.row.dcVip ?scope.row.dcVip:scope.row.nAccessIpPublic }}
          </span>
        </template>
      </el-table-column>
      <!--      <el-table-column align="center" prop="created_at" label="内网地址" width="130">-->
      <!--        <template slot-scope="scope">-->
      <!--          <span>{{ scope.row.nAccessIpInter }}</span>-->
      <!--        </template>-->
      <!--      </el-table-column>-->
      <el-table-column align="center" label="平台类型">
        <template slot-scope="scope">{{ scope.row.serverType }}</template>
      </el-table-column>
      <el-table-column align="center" label="隔离层次">
        <template slot-scope="scope">
          {{ scope.row.dbConfiguration? scope.row.dbConfiguration:scope.row.dbConfigType }}
        </template>
      </el-table-column>
      <el-table-column label="实例类型" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.deployMode }}</span>
        </template>
      </el-table-column>
      <el-table-column label="区域" align="center">
        <template slot-scope="scope">
          {{ scope.row.region ?scope.row.region:scope.row.nRegion }}
        </template>
      </el-table-column>
      <el-table-column class-name="status-col" label="运行状态" align="center">
        <template slot-scope="scope">
          <el-tag :type="scope.row.nStatus | statusFilter">
            {{ scope.row.dcStatus? scope.row.dcStatus:scope.row.nStatus }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column align="center" prop="created_at" label="计费模式">
        <template slot-scope="scope">
          <span>{{ scope.row.chargingMode }}</span>
        </template>
      </el-table-column>
      <el-table-column align="center" prop="created_at" label="端口号">
        <template slot-scope="scope">
          <span>{{ scope.row.dcPort?scope.row.dcPort:scope.row.nDbPort }}</span>
        </template>
      </el-table-column>
      <el-table-column align="center" label="数据库名称" width="110">
        <template slot-scope="scope">
          <a class="link-text" @click="handleJump(scope.$index)">
            {{ scope.row.dcDbName?scope.row.dcDbName:scope.row.nDbName }}</a>
        </template>
      </el-table-column>
      <!--      <el-table-column align="center" label="实例名称">-->
      <!--        <template slot-scope="scope">-->
      <!--          <a class="link-text" @click="handleJump(scope.$index)">{{scope.row.instanceName }}</a>-->
      <!--        </template>-->
      <!--      </el-table-column>-->
      <el-table-column align="center" prop="created_at" label="创建时间" width="190">
        <template slot-scope="scope">
          <span>
            {{ scope.row.dcCreateTime ? scope.row.dcCreateTime.replace("T", " ").substring(0, 19):scope.row.nCreateTime.substring(0, 19) }}
            <!--            {{!scope.row.dcCreateTime ? scope.row.dcCreateTime : scope.row.dcCreateTime.replace("T", " ").substring(0, 19)}}-->
          </span>
        </template>
      </el-table-column>
      <!--      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="130">-->
      <!--        <template slot-scope="{row,$index}">-->
      <!--          <el-dropdown style="margin-left: 10px" @command="handleCommand">-->
      <!--            <el-button size="mini" split-button type="primary" @click="getTableDig(row)"-->
      <!--                       :disabled="row.dcStatus!=='active'&&row.nStatus!=='active'">更多<i class="el-icon-arrow-down el-icon&#45;&#45;right"></i>-->
      <!--            </el-button>-->
      <!--            <el-dropdown-menu slot="dropdown">-->
      <!--              <el-dropdown-item command="start">启动</el-dropdown-item>-->
      <!--              <el-dropdown-item command="stop">停止</el-dropdown-item>-->
      <!--              <el-dropdown-item command="restart">重启</el-dropdown-item>-->
      <!--              <el-dropdown-item :command="composeValue('recovery',row)">备份/恢复</el-dropdown-item>-->
      <!--              <el-dropdown-item :command="composeValue('copy',row)">数据复制</el-dropdown-item>-->
      <!--              <el-dropdown-item :command="composeValue('transfer',row)">云迁移</el-dropdown-item>-->
      <!--              <el-dropdown-item :command="composeValue('expansion',row)">扩容</el-dropdown-item>-->
      <!--              <el-dropdown-item :command="composeValue('change',row)">规格变更</el-dropdown-item>-->
      <!--              <el-dropdown-item :command="composeValue('modify',row)">参数修改</el-dropdown-item>-->
      <!--              <el-dropdown-item :command="composeValue('delete',row)">删除实例</el-dropdown-item>-->
      <!--            </el-dropdown-menu>-->
      <!--          </el-dropdown>-->
      <!--        </template>-->
      <!--      </el-table-column>-->
    </el-table>

    <el-dialog width="30%" :title="dialogTitle" :visible.sync="dialogVisible">
      <span>确定要对以下数据库进行{{ dialogTitle }}操作吗？</span>
      <el-table :data="gridData">
        <el-table-column property="nDbName" label="实例名称" width="150" />
        <el-table-column property="nId" label="实例ID" width="100" />
        <el-table-column property="nStatus" label="运行状态" />
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="dialogVisible = false">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  filters: {
    statusFilter(status) {
      const statusMap = new Map()
      statusMap.set('published', 'success')
      statusMap.set('draft', 'gray')
      statusMap.set('deleted', 'danger')
      return statusMap.get(status)
    }
  },
  data() {
    return {
      dbCatalogId: '',
      list: [],
      checkedAll: false,
      serverId: '',
      type: '',
      supply: '',
      region: '',
      keyword: '',
      listLoading: true,
      dialogVisible: false,
      dialogTitle: '',
      ServerTypes: [],
      gridData: [],
      DeployMode: [],
      Provider: [],
      DataCenter: [],
      clock: ''
    }
  },
  mounted() {
    this.dbCatalogId = this.$route.query.dbCatalogId
    this.$nextTick(() => {
      this.$refs.table.doLayout()
    })
    this.getServerTypes()
    this.getTableList()
    // this.setTimer();
  },
  beforeDestroy() {
    var _this = this
    window.clearInterval(_this.clock)
  },
  methods: {
    checkOne(obj, boolValue) {
      obj.checked = boolValue
      // 判断存不存在children,存在就递归赋值
      if (obj.children) {
        obj.children.forEach(item => this.checkOne(item, boolValue))
      }
    },
    // 绑定每一行checkbox的change事件
    handleCheckedOne(row) {
      var _this = this
      if (row.checked) {
        this.checkOne(row, true)
        if (row.parentId !== 0) {
          _this.checkedAll = true
          this.list.map(items => {
            if (row.parentId === items.dcId) {
              _this.$set(items, 'checked', true)
              items.children.map(item => {
                if (!item.checked) {
                  _this.$set(items, 'checked', false)
                }
              })
            }
            if (!items.checked) {
              _this.checkedAll = false
            }
          })
        } else {
          this.checkedAll = true
          this.list.map(items => {
            if (!items.checked) {
              _this.checkedAll = false
            }
          })
        }
      } else {
        this.checkOne(row, false)
        this.checkedAll = false
        if (row.parentId) {
          this.list.map(items => {
            if (row.parentId === items.dcId) {
              _this.$set(items, 'checked', false)
            }
          })
        }
      }
    },
    checkAll(arr, boolValue) {
      arr.forEach(item => {
        item.checked = boolValue
        // children同样是数组
        if (item.children) {
          this.checkAll(item.children, boolValue)
        }
      })
    },
    handleCheckedAll(scope) {
      // 实际上scope并没有什么用处，仅为了解决上面提到的表头checkbox不显示的bug
      if (this.checkedAll) {
        this.checkAll(this.list, true)
      } else {
        this.checkAll(this.list, false)
      }
    },
    // 获取服务器类型
    getServerTypes() {
      const _this = this
      this.axios.get('/getServerTypes').then(res => {
        _this.ServerTypes = res.data.dataList
      }).catch(function(error) {
        _this.$message.error(error)
      })
    },
    // 获取实例类型
    getDeployMode() {
      const _this = this
      this.axios.get('/getDeployMode', {
        params: {
          serverId: _this.serverId
        }
      }).then(res => {
        _this.DeployMode = res.data.dataList
      }).catch(function(error) {
        _this.$message.error(error)
      })
    },
    // 获取云服务商
    getProvider() {
      const _this = this
      this.axios.get('/getProvider', {
        params: {
          serverId: _this.serverId
        }
      }).then(res => {
        _this.Provider = res.data.dataList
      }).catch(function(error) {
        _this.$message.error(error)
      })
    },
    // 获取数据中心
    getDataCenter() {
      const _this = this
      this.axios.get('/getDataCenter', {
        params: {
          providerId: _this.supply,
          serverId: _this.serverId
        }
      }).then(res => {
        _this.DataCenter = res.data.dataList
      }).catch(function(error) {
        _this.$message.error(error)
      })
    },
    // 改变服务器类型
    changeServer() {
      this.type = ''
      this.supply = ''
      this.region = ''
      this.getDeployMode()
      this.getProvider()
      // this.getDataCenter();
    },
    // 改变云供应商
    changeProvider() {
      this.region = ''
      this.getDataCenter()
    },
    blurDeployMode() {
      if (!this.serverId) {
        this.$message.error('请先选择服务器类型！')
      }
    },
    blurDataCenter() {
      if (!this.supply) {
        this.$message.error('请先选择云供应商！')
      }
    },
    getTableDig(row) {
      this.gridData = []
      this.gridData.push(row)
    },
    btnSearch() {
      var _this = this
      window.clearInterval(_this.clock)
      var list = this.list
      var formList = []
      var flag = ''
      if (this.serverId === 1) {
        flag = '虚拟机'
      } else if (this.serverId === 2) {
        flag = '裸金属'
      }
      if (this.serverId && !this.keyword) {
        // for (let i = 0; i < list.length; i++) {
        //   if (list[i].serverType === flag) {
        //     formList.push(list[i])
        //   }
        // }
        list.forEach((item) => {
          if (item.serverType === flag) {
            formList.push(item)
          }
        })
      }
      if (this.keyword && !this.serverId) {
        // for (let i = 0; i < list.length; i++) {
        //   if (list[i].nAccessIpPublic === this.keyword) {
        //     formList.push(list[i])
        //   }
        // }
        list.forEach((item) => {
          if (item.nAccessIpPublic === this.keyword) {
            formList.push(item)
          }
        })
        this.list = formList
      }
      if (this.keyword && this.serverId) {
        // for (let i = 0; i < list.length; i++) {
        //   if (list[i].serverType === flag && list[i].nAccessIpPublic === this.keyword) {
        //     formList.push(list[i])
        //   }
        // }
        list.forEach((item) => {
          if (item.servertype === flag && item.nAccessIpPublic === this.keyword) {
            formList.push(item)
          }
        })
        this.list = formList
      }
      this.list = formList
    },
    // 重置
    btnReset() {
      this.serverId = ''
      this.type = ''
      this.supply = ''
      this.region = ''
      this.keyword = ''
      this.DataCenter = []
      this.getTableList()
      this.setTimer()
    },
    // handleDataMonitor() {
    //   // window.location.href='http://121.36.225.81:58668/clustermonitor/#/clusterNodeMonitor/3/9';
    //   this.$router.push({
    //     path: '/DataMonitoring/index',
    //   });
    // },
    handleBackup(row) {
      this.$router.push({
        path: '/CreateBackup/index',
        query: {
          instanceId: row.instanceId
        }
      })
    },
    handleCommand(command) {
      if (command === 'start') {
        this.dialogVisible = true
        this.dialogTitle = '重启'
      }
      if (command === 'stop') {
        this.dialogVisible = true
        this.dialogTitle = '停止'
      }
      if (command === 'restart') {
        this.dialogVisible = true
        this.dialogTitle = '重启'
      }
      // 备份/恢复
      if (command.command === 'recovery') {
        this.$router.push({
          path: '/CreateBackup/index',
          query: {
            instanceId: command.row.instanceId
          }
        })
      }
      // 数据复制
      if (command.command === 'copy') {
        this.$router.push({
          path: '/DataReplication/details',
          query: {
            instanceId: command.row.instanceId
          }
        })
      }
      // 云迁移
      if (command.command === 'transfer') {
        this.$router.push({
          path: '/CloudMigration/details',
          query: {
            instanceId: command.row.instanceId
          }
        })
      }
      // 监控
      if (command === 'monitor') {
        this.$router.push({
          path: '/DataMonitoring/index'
        })
      }
      // 扩容
      if (command.command === 'expansion') {
        this.$router.push({
          path: '/DBExpansion/details',
          query: {
            instanceId: command.row.instanceId
          }
        })
      }
      // 规格变更
      if (command.command === 'change') {
        this.$router.push({
          path: '/DBSpecificationChange/details',
          query: {
            instanceId: command.row.instanceId
          }
        })
      }
      // 参数修改
      if (command === 'modify') {
        this.$router.push({
          path: '/ParameterModuleManage/index'
        })
      }
    },
    composeValue(name, row) {
      return {
        'row': row,
        'command': name
      }
    },
    handleJump(index) {
      this.$router.push({
        path: '/DBDetail/index',
        query: {
          instanceId: this.list[`${index}`].instanceId
        }
      })
    },
    // 定时器
    setTimer() {
      var _this = this
      this.clock = window.setInterval(() => {
        _this.getTableList2()
      }, 10000)
    },
    getTableList2() {
      var _this = this
      let userId = localStorage.getItem('userId')
      if (!userId) {
        userId = localStorage.getItem('userId')
      }
      this.axios.get('/getAllDataBasesForUser', {
        params: {
          userId: userId
        }
      })
        .then((response) => {
          var list = _this.AddChecked(response.data)
          // for (let i = 0; i < list.length; i++) {
          //   if (list[i].children != null) {
          //     list[i].children.map(item => {
          //       item.checked = false
          //       item.dcId = item.dbId
          //     })
          //   }
          // }
          list.forEach((element) => {
            if (element.children != null) {
              element.children.map(item => {
                item.checked = false
                item.dcId = item.dbId
              })
            }
          })
          _this.list = list
        })
        .catch((error) => {
          this.$message.error(error)
        })
    },
    // 获取表格
    getTableList() {
      var _this = this
      this.listLoading = true
      let userId = localStorage.getItem('userId')
      if (!userId) {
        userId = localStorage.getItem('userId')
      }
      this.axios.get('/getAllDataBasesForDbCatalog', {
        params: {
          dbCatalogId: _this.dbCatalogId
        }
      })
        .then((response) => {
          _this.listLoading = false
          var list = _this.AddChecked(response.data)
          // for (let i = 0; i < list.length; i++) {
          //   if (list[i].children != null) {
          //     list[i].children.map(item => {
          //       item.checked = false
          //       item.dcId = item.dbId
          //     })
          //   }
          // }
          list.forEach(element => {
            if (element.children != null) {
              element.children.map(item => {
                item.checked = false
                item.dcId = item.dbId
              })
            }
          })
          _this.list = list
        })
        .catch((error) => {
          this.$message.error(error)
        })
    },
    AddChecked(arr) {
      arr.map(item => {
        if (item) {
          item.checked = false
        }
      })
      return arr
    }
  }
}
</script>

<style lang="scss">
  .link-text {
    color: #409eff;
  }
</style>
