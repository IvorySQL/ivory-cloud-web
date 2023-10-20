<template>
  <div>
    <div class="app-container">
      总览
      <div class="base-container">
        <el-row :gutter="20">
          <el-col :span="7">
            <div>
              <el-statistic title="启动中的数据库">
                <template slot="formatter"> {{ instanceCountForm.startingCount }} </template>
              </el-statistic>
            </div>
          </el-col>
          <el-col :span="8">
            <div>
              <el-statistic title="运行中的数据库">
                <template slot="formatter"> {{ instanceCountForm.runningCount }} </template>
              </el-statistic>
            </div>
          </el-col>

          <el-col :span="7">
            <div>
              <el-statistic title="出错的数据库">
                <template slot="formatter"> {{ instanceCountForm.errorCount }} </template>
              </el-statistic>
            </div>
          </el-col>
        </el-row>
      </div>
      我的资源  <a><i class="el-icon-refresh-right" @click="getResourceCount" /></a>
      <div class="base-container">
        <el-row :gutter="40">
          <div v-if="resourceList.length === 0 || loading">
            <el-empty v-loading="loading" element-loading-text="Loading" description="暂无数据" />
          </div>
          <div v-else>
            <el-col v-for="(item, index) in resourceList.length" :key="item" :span="12" style="padding-bottom: 10px">
              <el-card :body-style="{ padding: '10px' }" style="border-radius: 4px">
                <div slot="header" class="clearfix">
                  <span>集群信息</span>
                </div>
                <div style="padding: 14px;">
                  <span>集群ID：{{ resourceList[index].clusterId }}</span>
                </div>
                <div style="padding: 14px;">
                  <span>集群名称：{{ resourceList[index].clusterName }}</span>
                </div>
                <div style="padding: 14px;">
                  <span>数据库总数：{{ resourceList[index].instanceCount }}</span>
                </div>
                <div style="padding: 14px;">
                  <span style="padding-right: 80px">运行：{{ resourceList[index].runningInstanceCount }}</span>
                  <span style="padding-right: 80px">错误：{{ resourceList[index].errorInstanceCount }}</span>
                  <span style="padding-right: 80px">其他：{{ resourceList[index].elseInstanceCount }}</span>
                </div>
                <div style="padding: 14px;">
                  <span>单节点数据库：{{ resourceList[index].aloneInstanceCount }}</span>
                </div>
                <div style="padding: 14px;">
                  <span>高可用数据库：{{ resourceList[index].haInstanceCount }}</span>
                </div>
              </el-card>
            </el-col>
          </div>
        </el-row>
      </div>
    </div>
  </div>
</template>

<script>
import checkPermission from '@/utils/permission'
export default {
  name: 'Dashboard',
  data() {
    return {
      instanceCountForm: {},
      userId: '',
      resourceList: [],
      clock: null,
      loading: false
    }
  },
  // 加载调用
  mounted() {
    if (checkPermission(['admin'])) {
      this.userId = 0
    } else {
      this.userId = localStorage.getItem('userId')
    }
    this.getInstanceCount()
    this.getResourceCount()
    this.setTimer()
  },
  beforeDestroy() {
    var _this = this
    window.clearInterval(_this.clock)
    _this.clock = null
  },
  methods: {
    // 获取实例总数
    getInstanceCount() {
      this.axios.get('/instances/action/count/' + this.userId)
        .then((response) => {
          this.instanceCountForm = response.data
        })
        .catch((error) => {
          this.$message.error(error)
        })
    },
    getResourceCount() {
      this.loading = true
      this.axios.get('/clusters/' + this.userId + '/resource')
        .then((response) => {
          this.loading = false
          this.resourceList = response.data
        })
        .catch((error) => {
          this.$message.error(error)
        })
    },
    setTimer() {
      const _this = this
      _this.clock = window.setInterval(() => { _this.getInstanceCount() }, 30000)
    }
  },
  checkPermission
}
</script>

<style lang="scss" scoped>

.base-container {
  background-color: #ffffff;
  margin: 10px 0 30px;
  border-radius: 10px;
  padding: 20px 15px 15px;
  overflow: hidden;
}

.clearfix:before,
.clearfix:after {
  display: table;
  content: "";
}
.clearfix:after {
  clear: both
}
</style>
