<template>
  <div>
    <el-row style="padding-bottom: 20px; margin: 20px;border-bottom: 1px solid #dcdfe6;">
      <span style="font-weight: 700; margin-right: 10px">数据库</span>
      <el-select
        v-model="type"
        placeholder="请选择数据库"
        style="margin-right: 10px"
      >
        <el-option label="Postgresql" value="1" />
        <el-option label="Highgo DB" value="2" />
      </el-select>
      <el-input
        v-model="keyword"
        placeholder="请输入内容"
        style="width: 200px; margin-right: 10px"
        prefix-icon="el-icon-search"
      />
      <el-button type="primary" icon="el-icon-search">搜索</el-button>
    </el-row>
    <div class="app-container">
      <el-form ref="form" label-width="150px">
        <el-form-item label="数据库名称">
          <span v-text="Info.nDbName" />
        </el-form-item>
        <el-form-item label="CPU类型">
          <span v-text="Info.cpuTypeName" />
        </el-form-item>
        <el-form-item label="磁盘">
          <el-slider
            v-model="form.newSpace"
            :step="1"
            :min="diskMin"
            :max="diskMax"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="onSubmit()">确定</el-button>
          <el-button @click="onCancel">取消</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script>

export default {
  data() {
    return {
      loading: false,
      dcId: '',
      oldSpace: '',
      diskMin: 1,
      diskMax: 100,
      form: {
        instanceName: '',
        specifications: '',
        newSpace: 10,
        cpuNum: 1,
        memorySize: 1,
        bandwidth: 1
      },
      rules: {
        cpuNum: [
          { required: true, message: '请输入CPU大小', trigger: 'change' }
        ],
        memorySize: [
          { required: true, message: '请输入内存大小', trigger: 'change' }
        ],
        specifications: [
          { required: true, message: '请选择性能规格', trigger: 'change' }
        ]
      },
      Info: {},
      DbOldInfo: {},
      list: [],
      Flavor: [],
      specificationsFlavor: {},
      type: '',
      keyword: '',
      disk: ''
    }
  },
  mounted() {
    this.dcId = this.$route.query.dcId
    this.getTableList()
  },
  methods: {
    // 获取规格
    getFlavor() {
      const _this = this
      this.axios.get('/getFlavor', {
        params: {
          datacenterId: _this.Info.nRegionId,
          cpuId: _this.Info.cpuId
        }
      }).then((res) => {
        if (res.data.dataList) {
          _this.Flavor = res.data.dataList
          // for (let i = 0; i < _this.Flavor.length; i++) {
          //   if (_this.Flavor[i].id === _this.Info.nFlavorId) {
          //     _this.specificationsFlavor = _this.Flavor[i]
          //   }
          // }
          _this.Flavor.forEach((item) => {
            if (item.id === _this.Info.nFlavorId) {
              _this.specificationsFlavor = item
            }
          })
        }
      }).catch(function(error) {
        this.$message.error(error)
      })
    },
    // 获取原来的数值
    getDbOldInfo() {
      const _this = this
      this.axios.get('/getFlavor/' + _this.dcId, {}).then((res) => {
        if (res.data.data) {
          _this.form.cpuNum = res.data.data.cpuNum
          _this.form.memorySize = res.data.data.memorySize
        }
      }).catch(function(error) {
        this.$message.error(error)
      })
    },
    getTableList() {
      this.axios.get('/getDataBaseDetailInfo', {
        params: {
          dcId: this.dcId
        }
      })
        .then((response) => {
          this.Info = response.data.data
          if (this.Info.serverTypeInt === 1) {
            this.getDbOldInfo()
            this.getFlavor()
            this.form.specifications = this.Info.nFlavor
            this.form.bandwidth = this.Info.bandwidth
            this.form.newSpace = this.Info.disk
            this.oldSpace = this.Info.disk
          } else if (this.Info.serverTypeInt === 2) {
            this.disk = this.Info.physicalnodeDisk
            this.form.newSpace = this.Info.disk
            this.oldSpace = this.Info.disk
            this.diskMax = this.Info.physicalnodeDiskFree + this.form.newSpace
            this.getDbOldInfo()
          }
        })
        .catch((error) => {
          this.$message.error(error)
        })
    },
    onSubmit(formName) {
      var _this = this
      var param = {}
      this.loading = true
      if (_this.Info.serverTypeInt === 2) {
        // 裸金属
        if (_this.oldSpace > _this.form.newSpace) {
          // 裸金属缩容
          this.$confirm('缩容操作将重启数据库, 是否继续?', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }).then(() => {
            this.$alert('请保证缩容后的空间比实例原来的空间', '提示', {
              confirmButtonText: '确定',
              callback: action => {
                param = {
                  'dcid': _this.dcId,
                  'cpuNum': _this.form.cpuNum,
                  'memorySize': _this.form.memorySize,
                  'bandWidth': 0,
                  'disk': _this.form.newSpace,
                  'flavor': {
                    'flId': 0,
                    'flFlavorName': ''
                  }
                }
                this.axios({
                  url: '/changeDisk',
                  method: 'post',
                  data: param
                }).then((res) => {
                  _this.loading = false
                  if (res.data.success) {
                    this.$message.success(res.data.message + '！')
                    this.$router.go(-1)
                  } else {
                    this.$message.error(res.data.message)
                    return false
                  }
                })
              }
            })
          }).catch(() => {
            this.$message({
              type: 'info',
              message: '已取消变更'
            })
          })
        } else {
          // 裸金属扩容
          param = {
            'dcid': _this.dcId,
            'cpuNum': _this.form.cpuNum,
            'memorySize': _this.form.memorySize,
            'bandWidth': 0,
            'disk': _this.form.newSpace,
            'flavor': {
              'flId': 0,
              'flFlavorName': ''
            }
          }
          this.axios({
            url: '/changeDisk',
            method: 'post',
            data: param
          }).then((res) => {
            _this.loading = false
            if (res.data.success) {
              this.$message.success(res.data.message + '！')
              this.$router.go(-1)
            } else {
              this.$message.error(res.data.message)
              return false
            }
          })
        }
      } else {
        // 虚拟机
        // for (let i = 0; i < _this.Flavor.length; i++) {
        //   if (_this.Flavor[i].name === _this.form.specifications) {
        //     _this.specificationsFlavor = _this.Flavor[i]
        //   }
        // }
        _this.Flavor.forEach((item) => {
          if (item.name === _this.form.specifications) {
            _this.specificationsFlavor = item
          }
        })
        param = {
          'dcid': _this.dcId,
          'cpuNum': null,
          'memorySize': null,
          'bandWidth': _this.form.bandwidth,
          'disk': _this.form.newSpace,
          'flavor': {
            'flId': _this.specificationsFlavor.id,
            'flFlavorName': _this.specificationsFlavor.name
          }
        }
        this.axios({
          url: '/changeDisk',
          method: 'post',
          data: param
        }).then((res) => {
          _this.loading = false
          if (res.data.success) {
            this.$message.success(res.data.message + '！')
            this.$router.go(-1)
          } else {
            this.$message.error(res.data.message)
            return false
          }
        })
      }
    },
    onCancel() {
      this.$router.go(-1)
    }
  }
}
</script>

<style scoped>
  .line {
    text-align: center;
  }

  .app-container {
    width: 590px;
    float: left;
  }

  #myChart {
    width: 50%;
    height: 600px;
    margin: 0 auto;
    padding: 120px 0;
    margin-left: 500px;
  }
</style>

