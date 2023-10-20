<template>
  <div>
    <el-row style="margin-bottom: 20px; float: right">
      <el-select
        v-model="cluster.name"
        placeholder="请选择集群"
        style="width: 160px;margin-right: 10px;"
        size="mini"
        @change="changeCluster"
      >
        <el-option
          v-for="item in Cluster"
          :key="item.clusterName"
          :label="item.clusterName"
          :value="item.clusterName"
        />
      </el-select>
      <el-input
        v-model="keyword"
        placeholder="请输入ID/名称查询"
        style="width: 160px;margin-right: 10px;"
        prefix-icon="el-icon-search"
        size="mini"
      />
      <el-button type="primary" icon="el-icon-search" size="mini" @click="btnSearch">搜索</el-button>
      <el-button icon="el-icon-refresh" size="mini" @click="btnReset">重置</el-button>
    </el-row>
  </div>
</template>

<script>
import checkPermission from '@/utils/permission'

export default {
  name: 'SSearchBox',
  data() {
    return {
      cluster: {
        id: '',
        name: ''
      },
      keyword: '',
      Cluster: [],
      searchForm: {
        clusterId: '',
        filter: ''
      },
      resultList: [],
      isTimerContinue: false
    }
  },
  mounted() {
    this.getCluster()
  },
  methods: {
    // 获取集群信息
    getCluster() {
      const _this = this
      this.axios.get('/clusters').then(res => {
        if (res.data && res.data.length !== 0) {
          _this.Cluster = res.data
        }
      }).catch(function(error) {
        _this.$message.error(error)
      })
    },
    changeCluster() {
      const _this = this
      // for (let i = 0; i < _this.Cluster.length; i++) {
      //   if (_this.cluster.name === _this.Cluster[i].clusterName) {
      //     _this.cluster.id = _this.Cluster[i].clusterId
      //   }
      // }
      _this.Cluster.forEach((element) => {
        if (_this.cluster.name === element.clusterName) {
          _this.cluster.id = element.clusterId
        }
      })
    },
    btnSearch() {
      const _this = this
      _this.searchForm.clusterId = _this.cluster.id
      _this.searchForm.filter = _this.keyword
      this.axios.get('/instances/1/1000', {
        params: {
          clusterId: _this.searchForm.clusterId,
          filter: _this.searchForm.filter
        }
      }).then((response) => {
        _this.listLoading = false
        _this.list = response.data.data
        _this.isTimerContinue = false
        this.$emit('resultList', _this.list, _this.isTimerContinue)
        // console.log(_this.isTimerContinue)
      }).catch((error) => {
        this.$message.error(error)
      })
    },
    btnReset() {
      const _this = this
      _this.cluster.id = ''
      _this.cluster.name = ''
      _this.keyword = ''
      this.listLoading = true
      let userId = localStorage.getItem('userId')
      if (!userId) {
        userId = localStorage.getItem('userId')
      }
      this.axios.get('/instances/list/' + userId, {})
        .then((response) => {
          _this.listLoading = false
          _this.list = response.data
          _this.isTimerContinue = true
          this.$emit('resultList', _this.list, _this.isTimerContinue)
          // console.log(_this.isTimerContinue)
        }).catch((error) => {
          this.$message.error(error)
        })
    },
    checkPermission
  }
}
</script>

<style scoped>

</style>
