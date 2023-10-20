<template>
  <!--   主备切换-->
  <el-dialog
    title="请选择一个备节点提升为主节点"
    :visible.sync="changeRedioDialogVisible"
    width="955px"
    :before-close="cancelDialog"
  >
    <el-table
      ref="singleTable"
      v-loading="loading"
      element-loading-text="Loading"
      :data="standbyNodes"
      style="width: 100%;margin-bottom: 20px;"
      border
      highlight-current-row
    >
      <el-table-column type="index" label="" align="center" width="55">
        <template slot-scope="scope">
          <el-radio
            v-model="currentRowId"
            :label="scope.row.node_ip ? scope.row.node_ip : scope.row.host"
            style="padding-left: 10px"
            @change="changeRadio($event,scope.row)"
          >
            {{ "" }}
          </el-radio>
        </template>
      </el-table-column>
      <el-table-column label="节点名称" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.replication_name }}</span>
        </template>
      </el-table-column>
      <el-table-column align="center" prop="created_at" label="ip地址" width="130">
        <template slot-scope="scope">
          {{ scope.row.node_ip }}
        </template>
      </el-table-column>
    </el-table>
    <el-row style="float: right;">
      <el-col>
        <div class="grid-content bg-purple-light">
          <el-button :loading="loading" type="primary" @click="dialogSubmit">确定</el-button>
          <el-button :disabled="loading" @click="cancelDialog">取消</el-button>
        </div>
      </el-col>
    </el-row>
  </el-dialog>
</template>

<script>
export default {
  name: 'ChangeRedioDialog',
  props: {
    visible: { type: Boolean, required: true },
    data: { type: Array, required: true }
  },
  data() {
    return {
      changeRedioDialogVisible: false,
      loading: false,
      standbyNodes: [],
      secondary: '',
      currentRowId: '',
      clusterInfo: [],
      selectNode: []
    }
  },
  watch: {
    visible: {
      handler(value) {
        this.changeRedioDialogVisible = value
      }
    },
    data: {
      handler(value) {
        this.secondaryData = value
      }
    }
  },
  mounted() {
    // this.getSelectResult(this.data);
  },
  methods: {
    refreshTable() {
      this.$emit('refreshTable')
    },
    cancelDialog() {
      var _this = this
      _this.$emit('update:visible', false)
      _this.$emit('update:data', [])
    }
    // changeRedio(event, row) {
    //   console.log('event,row:', event, row);
    //   this.currentRowId = event;
    //   this.secondary = row;
    // },
    // dialogSubmit() {
    //   var _this = this;
    //   console.log("primaryNode: ")
    //   console.log(_this.primaryNode)
    //   // console.log("standbyNodes: ")
    //   // console.log(_this.standbyNodes)
    //   // console.log("secondary: ");
    //   // console.log(_this.secondary)
    //   // console.log("selectNode: ");
    //   // console.log(_this.selectNode)
    //   if (_this.primaryNode === null || typeof _this.primaryNode === 'undefined' || _this.primaryNode === '') {
    //     var standby = _this.secondary.node_ip;
    //     // console.log(_this.selectNode);
    //     var dbId = "";
    //     for (let i = 0 ; i < _this.selectNode.length ; i++) {
    //       var selectArray = _this.selectNode[i];
    //       if (standby === selectArray.nAccessIpInter) {
    //         dbId = selectArray.dbId;
    //         console.log(dbId);
    //         break;
    //       }
    //     }
    //     _this.loading = true;
    //     if (!dbId) {
    //       _this.$message.error('请选择要升为主节点的服务器！');
    //       _this.loading = false;
    //       return;
    //     }
    //     this.axios.post('/switchover/dbha/' + dbId, {}).then(res => {
    //       this.listLoading = false;
    //       _this.loading = false;
    //       if (res.data.success) {
    //         this.$message.success('主备切换成功！');
    //         this.getTableList();
    //       } else {
    //         this.$message.error('主备切换失败！');
    //       }
    //       this.currentRowId = '';
    //       this.standbyNodes = [];
    //       this.dialogVisible1 = false;
    //     }).catch(function (error) {
    //       _this.$message.error(error);
    //     });
    //   } else {
    //     // console.log("This is a hghac cluster")
    //     _this.loading = true;
    //     this.axios.post('/switchover/hghac', {
    //       "dcId": _this.selectNode[0].realDcId,
    //       "newLeaderIp": _this.secondary.host,
    //       "leader": _this.primaryNode.name,
    //       "candidate": _this.secondary.name
    //     }).then(res => {
    //       this.listLoading = false;
    //       _this.loading = false;
    //       if (res.data.success) {
    //         this.$message.success('主备切换成功！');
    //         this.getTableList();
    //       } else {
    //         this.$message.error('主备切换失败！');
    //       }
    //       this.currentRowId = '';
    //       this.standbyNodes = [];
    //       this.primaryNode = '';
    //       this.selectNode = [];
    //       this.dialogVisible1 = false;
    //     }).catch(function (error) {
    //       _this.$message.error(error);
    //     });
    //   }
    // },
    // setCurrent() {
    //   this.changeRedioDialogVisible = false;
    //   this.secondary = '';
    //   this.currentRowId = '';
    //   this.standbyNodes = [];
    // },
    // getSelectResult(row) {
    //   let _this = this;
    //   if (row.deployModeType === 2) {
    //     // _this.dialogVisible1 = true;
    //     _this.loading = true;
    //     this.axios.get('/select/dbha/' + row.dcId).then(res => {
    //       if (res.status === 200 && res.data.success) {
    //         _this.loading = false;
    //         _this.clusterInfo = JSON.parse(res.data.message);
    //         // console.log(_this.clusterInfo)
    //         //获取所有备节点
    //         _this.standbyNodes = _this.clusterInfo.nodes.filter(item => item.node_type === "standby");
    //
    //       } else {
    //         this.$message.error('查询集群状态失败！');
    //       }
    //     }).catch(function (error) {
    //       _this.$message.error(error);
    //     });
    //   } else if (row.deployModeType === 5) {
    //     // _this.dialogVisible1 = true;
    //     _this.loading = true;
    //     this.axios.get('/select/hghac/' + row.dcId).then(res => {
    //       if (res.status === 200 && res.data.success) {
    //         _this.loading = false;
    //         _this.clusterInfo = JSON.parse(res.data.message);
    //         console.log(_this.clusterInfo)
    //         //获取所有备节点
    //         _this.standbyNodes = _this.clusterInfo.members.filter(item => item.role === "replica");
    //         //获取主节点
    //         _this.primaryNode = _this.clusterInfo.members.find(item => item.role === "leader");
    //         console.log(_this.primaryNode)
    //       } else {
    //         this.$message.error('查询集群状态失败！');
    //       }
    //     }).catch(function (error) {
    //       _this.$message.error(error);
    //     });
    //   } else {
    //     _this.$message({
    //       message: '单机数据库无法进行主备切换！',
    //       type: 'warning'
    //     });
    //   }
    // },
  }
}
</script>

<style scoped>

</style>
