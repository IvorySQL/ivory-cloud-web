<template>
  <div>
    <div class="app-container">
      <el-form ref="form" :model="confirmData" label-width="130px" label-position="left">
        <div class="base-container">
          <el-row style="margin: 5px 0 20px">
            <span style="font-size: 20px;font-weight: 600">{{ confirmData.ProductName }}</span>
          </el-row>
          <el-col :xs="24" :sm="24" :md="24" :lg="12" :xl="8" style="display: none">
            <el-form-item label="计费方式">
              {{ confirmData.chargingMode===1?'按需':'包年/月' }}
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24" :md="20" :lg="12" :xl="8" style="display: none">
            <el-form-item label="自动续费">
              否
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="24" :md="20" :lg="12" :xl="8">
            <el-form-item label="集群">
              {{ confirmData.ClusterName }}
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24" :md="20" :lg="12" :xl="8">
            <el-form-item label="命名空间">
              {{ confirmData.NamespaceName }}
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24" :md="24" :lg="12" :xl="8">
            <el-form-item label="数据库引擎">
              {{ confirmData.ProductName }}
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24" :md="20" :lg="12" :xl="8">
            <el-form-item label="版本">
              {{ confirmData.VersionName }}
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24" :md="24" :lg="12" :xl="8">
            <el-form-item label="实例类型">
              {{ confirmData.typeName }}
            </el-form-item>
          </el-col>
          <el-col v-show="confirmData.isRestore" :xs="24" :sm="24" :md="24" :lg="12" :xl="8">
            <el-form-item label="恢复到实例">
              {{ confirmData.restoreType === 1 ? "原实例" : "新实例" }}
            </el-form-item>
          </el-col>
        </div>
        <div class="base-container">
          <el-col :xs="24" :sm="24" :md="24" :lg="12" :xl="8">
            <el-form-item label="实例名称">
              {{ confirmData.name }}
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24" :md="20" :lg="12" :xl="8">
            <el-form-item label="实例描述">
              {{ confirmData.description }}
            </el-form-item>
          </el-col>
        </div>
        <div class="base-container">
          <el-col :xs="24" :sm="24" :md="24" :lg="12" :xl="8">
            <el-form-item label="性能规格">
              {{ confirmData.cpuNum }} vCPUs | {{ confirmData.memorySize }} GB
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24" :md="24" :lg="12" :xl="8">
            <el-form-item label="存储类型">
              {{ confirmData.StorageClassName }}
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24" :md="20" :lg="12" :xl="8">
            <el-form-item label="存储空间">
              {{ confirmData.size }} GB
            </el-form-item>
          </el-col>
        </div>
        <div class="base-container" style="display: none">
          <el-row>
            <el-col :xs="24" :sm="24" :md="24" :lg="12" :xl="8">
              <el-form-item label="价格">
                {{ confirmData.price }}&nbsp;元/小时
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <el-form-item>
          <el-button type="primary" :loading="loading" @click="onSubmit">确定</el-button>
          <el-button :disabled="loading" @click="onCancel">上一步</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>
<style scoped>
  .show-pwd {
    position: absolute;
    right: 10px;
    top: 0px;
    font-size: 16px;
    color: #889aa4;
    cursor: pointer;
    user-select: none;
  }

  .button-group {
    float: right;
    margin-right: 40px;
  }

  .button-group button {
    background-color: #409eff;
    border: none;
    color: aliceblue;
    padding: 7px;
    margin: 2px;
    font-size: 14px;
    width: 84px;
    border-radius: 20px;
    outline: none;
  }

  .button-detail {
    background-color: #409eff;
    border: none;
    color: aliceblue;
    padding: 7px;
    margin: 2px;
    font-size: 14px;
    width: 84px;
    border-radius: 20px;
    outline: none;
  }

  .button-detail1 {
    background-color: #409eff;
    border: none;
    font-size: 14px;
    width: 84px;
    color: aliceblue;
    padding: 7px;
    margin-left: 22px;
    border-radius: 20px;
    outline: none;
  }

  .base-container {
    background-color: #ffffff;
    margin: 10px 0 30px;
    border-radius: 10px;
    padding: 20px 15px 0px;
    overflow: hidden;
  }

  .detail-table {
    width: 800px;
    float: left;
    margin: 0 auto;
  }

  .button-expand {
    width: 80px;
    background-color: #409eff;
    border: none;
    color: aliceblue;
    padding: 7px;
    font-size: 14px;
    border-radius: 20px;
    margin: 50px 0px;
    outline: none;
  }
</style>
<script>
export default {
  data() {
    return {
      flag: true,
      form: {},
      createForm: '',
      confirmData: {},
      loading: false
    }
  },
  mounted() {
    var createForm = sessionStorage.getItem('createForm')
    this.createForm = JSON.parse(createForm)
    this.form = sessionStorage.getItem('form')
    var confirmData = sessionStorage.getItem('confirmData')
    this.confirmData = JSON.parse(confirmData)
  },
  methods: {
    onSubmit() {
      const _this = this
      this.loading = true
      const str = JSON.stringify(_this.createForm)
      // 走恢复原实例的接口
      if (_this.confirmData.restoreType === 1) {
        // console.log("go restore")
        this.axios.post('/instances/' + _this.createForm.originalInstanceId + '/restore',
          {
            'backupId': _this.createForm.originalBackupId
          },
          { headers: { 'Content-Type': 'application/json; charset=UTF-8' }})
          .then(function(response) {
            _this.loading = false
            if (response.data.status === 'CREATING') {
              _this.$message.success('数据库恢复中，请耐心等待')
              _this.$router.push({ path: '/nativeCloud/DBManage/index' })
            } else {
              _this.$message.error(response.data.message)
              _this.$router.push({ path: '/nativeCloud/DBInstance/index', query: { flag: _this.flag }})
            }
          }).catch(function(error) {
            _this.$message.error(error)
          })
      } else {
        // 走新建实例的接口
        // console.log("go create")
        this.axios.post('/instances', str, { headers: { 'Content-Type': 'application/json; charset=UTF-8' }})
          .then(function(response) {
            _this.loading = false
            if (response.data.status === 'CREATING') {
              _this.$message.success('数据库创建中，请耐心等待')
              _this.$router.push({ path: '/nativeCloud/DBManage/index' })
            } else {
              _this.$message.error(response.data.message)
              _this.$router.push({ path: '/nativeCloud/DBInstance/index', query: { flag: _this.flag }})
            }
          }).catch(function(error) {
            _this.$message.error(error)
          })
      }
    },
    onCancel() {
      var _this = this
      this.$router.push({ path: '/nativeCloud/DBInstance/index', query: { flag: _this.flag }})
    }
  }
}
</script>

