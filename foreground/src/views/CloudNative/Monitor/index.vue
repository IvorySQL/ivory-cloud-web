<template>
  <div>
    <div
      v-loading="createMonitorInProcess"
      style="width: 100%;margin-top: 100px"
      element-loading-text="监控创建中，初始化时间较长，请您耐心等待..."
    />
    <!-- 选择监控的集群 -->
    <el-dialog
      title="选择集群"
      :visible.sync="isClusterNotChecked"
      :close-on-click-modal="false"
      @close="closeConfigMonitor()"
    >
      <el-form ref="monitorForm" :model="monitorForm" :label-width="formLabelWidth" :rules="rules" label-position="right">
        <el-col style="padding-left: 40px">
          <el-form-item label="集群名称" prop="clusterName">
            <el-select v-model="monitorForm.clusterName" placeholder="集群名称" size="small" @change="changeCluster">
              <el-option
                v-for="item in Cluster"
                :key="item.clusterName"
                :label="item.clusterName"
                :value="item.clusterName"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="集群ID" prop="clusterId">
            <el-select v-model="monitorForm.clusterId" placeholder="请选择要监控的集群" size="small" disabled>
              <el-option
                v-for="item in Cluster"
                :key="item.clusterId"
                :label="item.clusterId"
                :value="item.clusterId"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="getMonitorUrlStatus('monitorForm')">确 定</el-button>
        <el-button @click="closeConfigMonitor()">关 闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  data() {
    return {
      createMonitorInProcess: false,
      userId: '',
      userName: '',
      url1: '',
      clock: '',
      Cluster: [],
      monitorList: [],
      monitorForm: {
        clusterName: '',
        clusterId: '',
        accessMode: 'ReadWriteOnce',
        namespace: '',
        monitorStatus: '',
        monitorUrl: '',
        userId: ''
      },
      formLabelWidth: '120px',
      isClusterNotChecked: true,
      rules: {
        clusterName: [
          { required: true, message: '集群不能为空', trigger: 'change' }
        ]
      }
    }
  },
  mounted() {
    var _this = this
    var userId = localStorage.getItem('userId')
    var userName = localStorage.getItem('userName')
    if (!userId) {
      userId = localStorage.getItem('userId')
      userName = localStorage.getItem('userName')
    }
    this.userId = userId
    this.userName = userName
    _this.monitorForm.userId = this.userId
    _this.getCluster()
  },
  beforeDestroy() {
    var _this = this
    window.clearInterval(_this.clock)
    _this.clock = null
  },
  methods: {
    // 获取集群信息
    getCluster(event) {
      const _this = this
      this.axios.get('/clusters').then(res => {
        if (res.data) {
          _this.Cluster = res.data
          // for (let i = 0; i < _this.Cluster.length; i++) {
          //   _this.monitorForm.clusterName = _this.Cluster[i].clusterName
          //   _this.monitorForm.clusterId = _this.Cluster[i].clusterId
          // }
          _this.Cluster.forEach((item) => {
            _this.monitorForm.clusterId = item.clusterId
            _this.monitorForm.clusterName = item.clusterName
          })
        }
      }).catch(function(error) {
        _this.$message.error(error)
      })
    },
    closeConfigMonitor() {
      this.$router.go(-1)
    },
    changeCluster() {
      // for (let i = 0; i < this.Cluster.length; i++) {
      //   if (this.monitorForm.clusterName === this.Cluster[i].clusterName) {
      //     this.monitorForm.clusterId = this.Cluster[i].clusterId
      //   }
      // }
      const _this = this
      this.Cluster.forEach(item => {
        if (item.clusterName === _this.monitorForm.clusterName) {
          _this.monitorForm.clusterId = item.clusterId
        }
      })
    },
    setTimer() {
      var _this = this
      _this.clock = window.setInterval(() => {
        _this.getMonitorUrlTimer()
      }, 10000)
    },
    getMonitorUrlTimer() {
      const _this = this
      _this.createMonitorInProcess = true
      // 去后台获取监控状态
      this.axios.post('/monitor',
        {
          'userId': _this.userId,
          'name': _this.userName,
          'namespace': '',
          'monitorStatus': '',
          'monitorUrl': '',
          'accessMode': _this.monitorForm.accessMode,
          'clusterId': _this.monitorForm.clusterId
        },
        { headers: { 'Content-Type': 'application/json; charset=UTF-8' }}).then(res => {
        if (res.data.monitorStatus === 'CREATING') {
          _this.isClusterNotChecked = false
        } else if (res.data.monitorStatus === 'RUNNING') {
          _this.isClusterNotChecked = true
          console.log(res.data.monitorUrl)
          if (res.data.monitorUrl) {
            const url = res.data.monitorUrl
            window.open('http://' + url, '_blank')
            _this.closeConfigMonitor()
          }
        } else if (res.data === '') {
          _this.isClusterNotChecked = false
        } else {
          this.$message.error(res.data.message)
        }
      }).catch(function(error) {
        _this.$message.error(error)
      })
    },
    // 获取监控创建的状态
    getMonitorUrlStatus(formName) {
      const _this = this
      this.$refs[`${formName}`].validate((valid) => {
        if (valid) {
          _this.createMonitorInProcess = true
          // 去后台获取监控状态
          this.axios.post('/monitor',
            {
              'userId': _this.userId,
              'name': _this.userName,
              'namespace': '',
              'monitorStatus': '',
              'monitorUrl': '',
              'accessMode': _this.monitorForm.accessMode,
              'clusterId': _this.monitorForm.clusterId
            },
            { headers: { 'Content-Type': 'application/json; charset=UTF-8' }}).then(res => {
            if (res.data.monitorStatus === 'CREATING') {
              this.$message.info('监控创建中，请耐心等待...')
              _this.isClusterNotChecked = false
              _this.setTimer()
            } else if (res.data.monitorStatus === 'RUNNING') {
              _this.listLoading = false
              if (res.data.monitorUrl) {
                const url = res.data.monitorUrl
                window.open('http://' + url, '_blank')
                _this.closeConfigMonitor()
              }
            } else if (res.data === '') {
              this.$message.info('监控初始化中，请耐心等待...')
              _this.isClusterNotChecked = false
              _this.setTimer()
            } else {
              this.$message.error(res.data.message)
            }
          }).catch(function(error) {
            _this.$message.error(error)
          })
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
  #monitor {
    width: 100%;
    min-height: 93vh;
    margin: 0;
    padding: 0;
  }
  .el-dialog__body {
    padding: 30px 20px 50px;
  }
</style>
