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
        <el-form-item v-if="Info.serverTypeInt==2" label="CPU" prop="cpuNum">
          <el-slider
            v-model="form.cpuNum"
            :step="1"
            :min="1"
            :max="physicalnodeCpuFree"
            show-stops
          />
        </el-form-item>
        <el-form-item v-if="Info.serverTypeInt==2" label="内存" prop="memorySize">
          <el-slider
            v-model="form.memorySize"
            :step="1"
            :min="1"
            :max="physicalnodeMemoryFree"
            show-stops
          />
        </el-form-item>
        <el-form-item v-if="Info.serverTypeInt==1" label="性能规格">
          <el-select v-model="form.specifications" placeholder="请选择性能规格" size="small">
            <el-option
              v-for="item in Flavor"
              :key="item.id"
              :label="item.extention.cpu+'核/'+item.extention.memory+'G'"
              :value="item.name"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="Info.serverTypeInt==1" label="带宽">
          <el-slider
            v-model="form.bandwidth"
            :step="1"
            :min="1"
            :max="100"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSubmit()">确定</el-button>
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
      dcId: '',
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
      physicalnodeCpu: '',
      physicalnodeCpuFree: '',
      physicalnodeMemory: '',
      physicalnodeMemoryFree: '',
      physicalnodeDisk: '',
      physicalnodeDiskFree: ''
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
          _this.physicalnodeCpuFree = _this.physicalnodeCpuFree + res.data.data.cpuNum
          _this.physicalnodeMemoryFree = _this.physicalnodeMemoryFree + res.data.data.memorySize
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
          } else if (this.Info.serverTypeInt === 2) {
            this.physicalnodeCpu = this.Info.physicalnodeCpu
            this.physicalnodeCpuFree = this.Info.physicalnodeCpuFree
            this.physicalnodeMemory = this.Info.physicalnodeMemory
            this.physicalnodeMemoryFree = this.Info.physicalnodeMemoryFree
            this.physicalnodeDisk = this.Info.physicalnodeDisk
            this.physicalnodeDiskFree = this.Info.physicalnodeDiskFree
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
      // 裸金属
      if (_this.Info.serverTypeInt === 2) {
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
      }
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
      if (_this.Info.serverTypeInt === 1) {
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
      }

      this.axios({
        url: '/changeFlavor',
        method: 'post',
        data: param
      }).then((res) => {
        if (res.data.success) {
          this.$message.success('修改成功！')
          this.$router.go(-1)
        } else {
          this.$message.error('修改失败！')
          return false
        }
      })
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

