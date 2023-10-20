<template>
  <div>
    <div>
      <el-row
        style="
        padding-bottom: 20px;
        margin: 20px 10px;
        border-bottom: 1px solid #dcdfe6; "
      >
        <span style="font-size:14px;font-weight: 600; margin-left: 10px">数据库名称：</span>
        <el-input v-model="DbDetail.dcDbName" style="width: 200px;" />
        <span style="font-size:14px;font-weight: 600; margin-left: 10px">数据库端口：</span>
        <el-input v-model="DbDetail.dcPort" style="width: 120px;" />
        <span style="font-size:14px;font-weight: 600; margin-left: 10px">实例名称：</span>
        <el-input v-model="DbDetail.dcName" style="width: 200px;" />
        <span style="font-size:14px;font-weight: 600; margin-left: 10px">公网IP：</span>
        <el-input v-model="DbDetail.dcVip" style="width: 200px;" />
      </el-row>
    </div>
    <div class="app-container">
      <el-form ref="form" :model="form" label-width="150px" :rules="rules">
        <el-form-item label="备份名称">
          <el-input v-model="form.Name" style="width: 250px" size="small" />
        </el-form-item>
        <el-form-item v-if="form.BackupType==='1'" label="备份方式">
          <el-radio-group v-model="form.BackupMode" size="small" @change="changeBackupType">
            <el-radio label="0" value="0">手动备份</el-radio>
            <el-radio label="1" value="1">自动备份</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="form.BackupMode!=='1'" label="备份类型" style="display: none;">
          <el-radio-group v-model="form.BackupType" size="small">
            <el-radio label="0" value="0">逻辑备份</el-radio>
            <el-radio label="1" value="1">物理备份</el-radio>
          </el-radio-group>
        </el-form-item>
        <!-- <el-form-item label="存储方式"> -->
        <!-- <el-radio-group v-model="form.StorageMode" size="small" @change="changeStorageMode">
          <el-radio label="0" value="0">本地存储</el-radio>
          <el-radio label="1" value="1">远程存储</el-radio>
        </el-radio-group> -->
        <!-- <el-button class="button-expand" @click="JumpToExpand" style="margin-left: 20px">扩容</el-button>
      </el-form-item> -->
        <el-form-item v-if="form.BackupType === '1' && form.BackupMode ==='0'" label="同步方式">
          <el-radio-group v-model="form.magnitude" size="small">
            <el-radio label="0" value="0">全量</el-radio>
            <el-radio v-if="form.BackupMode==='0'" label="1" value="1" :disabled="enableIncrementBackup">增量</el-radio>
          </el-radio-group>
        </el-form-item>
        <!-- <el-form-item label="远程存储" v-if="form.StorageMode==='1'">
          <el-select placeholder="请选择远程服务器地址" size="small" v-model="form.longRange" :disabled="enableAddRemoteServer">
            <el-option
              v-for="item in backupServer"
              :key="item.id"
              :label="item.ip"
              :value="item.id">
            </el-option>
          </el-select>
          <el-button class="button-expand" style="margin-left: 20px;width: 180px;" @click="addBackupServer">增加远程备份服务器
          </el-button>
        </el-form-item> -->
        <el-row>
          <el-form-item v-if="form.BackupMode==='1'" label="备份策略" prop="backupPolicyid" size="small">
            <el-select v-model="form.backupPolicyid" placeholder="请选择">
              <el-option
                v-for="item in backupPolicylist"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item v-if="form.BackupMode==='1'" label="保留策略" prop="retentionPolicyid" size="small">
            <el-select v-model="form.retentionPolicyid" placeholder="请选择">
              <el-option
                v-for="item in retentionPolicylist"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </el-row>
        <el-form-item style="margin-top: 10px">
          <el-button type="primary" :loading="buttonLoading" @click="onSubmit('form')">确定</el-button>
          <el-button @click="onCancel">取消</el-button>
        </el-form-item>
      </el-form>
      <!--    模态框-->
      <el-dialog title="增量备份" :visible.sync="dialogFormVisible">
        <el-form>
          <el-form-item label="增量备份名称：" label-width="150px">
            <el-input v-model="dialogForm.name" size="small" />
          </el-form-item>
          <el-form-item label="上一次备份名称：" label-width="150px">
            <el-select v-model="dialogForm.lastname" placeholder="请选择上次备份名称" style="width: 100%" size="small">
              <el-option label="196.168.1.2" value="1" />
              <el-option label="196.168.1.3" value="2" />
            </el-select>
          </el-form-item>
        </el-form>
        <div slot="footer" class="dialog-footer">
          <el-button type="primary" @click="changePeriod">确 定</el-button>
          <el-button @click="dialogFormVisible = false">取 消</el-button>
        </div>
      </el-dialog>
    </div>
    <div>
      <div id="myChart" />
    </div>
  </div>
</template>

<script>
import echarts from 'echarts'

const cityOptions = [
  { id: 1, name: '星期一' },
  { id: 2, name: '星期二' },
  { id: 3, name: '星期三' },
  { id: 4, name: '星期四' },
  { id: 5, name: '星期五' },
  { id: 6, name: '星期六' },
  { id: 0, name: '星期日' }]
export default {
  data() {
    return {
      userId: '',
      dcId: '',
      dbId: '',
      flag: '',
      dialogFormVisible: false,
      dialogForm: {
        name: '',
        lastname: ''
      },
      rules: {
        backupPolicyid: [{ required: true, trigger: 'blur', message: '备份策略未选择！' }],
        retentionPolicyid: [{ required: true, trigger: 'blur', message: '保留策略未选择！' }]
      },
      form: {
        retentionPolicyid: '',
        backupPolicyid: '',
        Name: 'highgosee',
        // StorageMode: '0',
        BackupMode: '0',
        longRange: '',
        daynum: '14',
        increRate: '5',
        magnitude: '0',
        timeZone: '',
        BackupPeriod: '',
        BackupType: '0',
        startTime: '',
        endTime: '',
        checkedCitiesid: ''
      },
      buttonLoading: false,
      DbDetail: '',
      instanceId: '',
      checkAll: false,
      checkedCities: [],
      cities: cityOptions,
      isIndeterminate: true,
      echartsOption: {
        // echarts选项，所有绘图数据和样式都在这里设置
        legend: {
          // 图表上方的图例
          data: ['可用', '已用']
        },
        tooltip: {
          // 鼠标放到图上的数据展示样式
          trigger: 'axis'
        },
        series: [
          {
            name: '磁盘空间',
            type: 'pie',
            barWidth: '60%',
            data: [
              // 扇形图数据格式： {value, name}
              { value: 0.35, name: '可用' }, // value不一定是比例，echarts会自动转换
              { value: 0.2, name: '已用' }

            ]
          }
        ]
      },
      TimeZone: [],
      BackupWindow: [],
      BackupPeriod: [],
      backupServer: [],
      backupPolicylist: [],
      retentionPolicylist: [],
      Filelist: [],
      autoFlag: 0,
      // 是否enable增量备份：0：disable；1：enable
      // 只有数据库做过一次成功的全量备份，才可以enable 增量备份
      enableIncrementBackup: false,
      // 是否enable选择远程服务器：0：disable；1：enable
      // 数据库做过远程备份后，不允许再选择新的备份服务器
      enableAddRemoteServer: false
    }
  },
  mounted() {
    const myChart = echarts.init(document.getElementById('myChart'), 'light') // 初始化echarts, theme为light
    myChart.setOption(this.echartsOption) // echarts设置选项
    var userId = localStorage.getItem('userId')
    if (!userId) {
      userId = localStorage.getItem('userId')
    }
    this.userId = userId
    this.dbId = this.$route.query.dbId
    this.dcId = this.$route.query.dcId
    this.flag = this.$route.query.flag
    // this.DataDiskExpansionHandle();
    this.getTableList()
    if (this.dcId) {
      this.getAllBackupFilesBydcId(this.dcId)
    }
  },
  methods: {
    changeBackupType() {
      if (this.form.BackupType === 1) {
        this.getBackupPolicyList()
        this.getAllRetentionPolicyList()
      }
    },
    // 获取备份策略
    getBackupPolicyList() {
      var _this = this
      this.axios.get('/getAllBackupPolicy', {})
        .then((response) => {
          console.log(response)
          _this.backupPolicylist = response.data
        })
        .catch((error) => {
          this.$message.error(error)
        })
    },
    // 获取保留策略
    getAllRetentionPolicyList() {
      var _this = this
      this.axios.get('/getAllRetentionPolicy', {})
        .then((response) => {
          _this.retentionPolicylist = response.data
        })
        .catch((error) => {
          this.$message.error(error)
        })
    },
    // 增加备份服务器按钮事件
    addBackupServer() {
      this.$router.push({
        path: '/nested/menu3'
      })
    },
    // //本地、远程change事件
    // changeStorageMode() {
    //   var _this = this;
    //   if (this.form.StorageMode == 1) {
    //     this.getBackupServer();
    //     var list = _this.Filelist;
    //     if (_this.Filelist.length > 0) {
    //       for (var i = 0; i < list.length; i++) {
    //         //数据库是否做过一次成功的全量备份
    //         //syncType==0： 全量；syncType ==1：增量
    //         if (0 == list[i].syncType) {
    //           _this.enableIncrementBackup = false;
    //           break;
    //         } else {
    //           _this.enableIncrementBackup = true;
    //           _this.form.magnitude = '0';
    //         }
    //       }
    //     }
    //   } else {
    //     _this.enableIncrementBackup = false;
    //   }
    // },
    changeStartTime() {
      this.form.endTime = ''
    },
    getAllBackupFilesBydcId(dcId) {
      var _this = this
      this.axios.get('/getAllBackupFilesBydcId', {
        params: {
          dcId: dcId
        }
      })
        .then((response) => {
          _this.Filelist = response.data
          var list = _this.Filelist
          if (_this.Filelist.length > 0) {
            // for (var i = 0; i < list.length - 1; i++) {
            //   if (list[i].autoBackupInfo) {
            //     if (list[i].autoBackupInfo === 1) {
            //       _this.autoFlag = 1
            //     }
            //   }
            // }
            list.forEach(item => {
              if (item.autoBackupInfo && item.autoBackupInfo === 1) {
                _this.autoFlag = 1
              }
            })
          }
        })
        .catch((error) => {
          this.$message.error(error)
        })
    },
    // 获取该用户下面的备份服务器信息
    getBackupServer() {
      const _this = this
      this.axios.get('/getAllBackupServer', {
        params: {
          userId: _this.userId
        }
      }).then(res => {
        if (res.data) {
          _this.backupServer = res.data
        }
      }).catch(function(error) {
        _this.$message.error(error)
      })
    },
    // 获取数据库详情
    getTableList() {
      var _this = this
      this.loading = true
      if (this.dbId) {
        this.axios.get('/getDataBaseDetailInfo', {
          params: {
            dbId: this.dbId
          }
        })
          .then((response) => {
            this.loading = false
            _this.DbDetail = response.data.data
            if (_this.DbDetail.dbConfiguration === '共享实例') {
              _this.form.BackupType = '0'
            } else {
              _this.form.BackupType = '1'
            }
          })
          .catch((error) => {
            this.$message.error(error)
          })
      } else if (this.dcId) {
        this.axios.get('/getDbCatalogBydcId', {
          params: {
            dcId: this.dcId
          }
        })
          .then((response) => {
            this.loading = false
            _this.DbDetail = response.data.data
            if (_this.DbDetail.dbConfiguration === '共享实例') {
              _this.form.BackupType = '0'
            } else {
              _this.form.BackupType = '1'
            }
            if (_this.DbDetail.backupServerId !== 0) {
              _this.enableAddRemoteServer = true
              // console.log(list[i]);
              _this.form.longRange = _this.DbDetail.backupServerId
            }
          })
          .catch((error) => {
            this.$message.error(error)
          })
      }
    },
    // 获取时区
    getTimeZone() {
      const _this = this
      this.axios.get('/getTimeZone').then(res => {
        _this.TimeZone = res.data.dataList
      }).catch(function(error) {
        _this.$message.error(error)
      })
    },
    // 获取备份时间段
    getBackupWindow() {
      const _this = this
      this.axios.get('/getBackupWindow').then(res => {
        _this.BackupWindow = res.data.dataList
      }).catch(function(error) {
        _this.$message.error(error)
      })
    },
    // 获取备份周期
    getBackupPeriod() {
      const _this = this
      this.axios.get('/getBackupPeriod').then(res => {
        _this.BackupPeriod = res.data.dataList
      }).catch(function(error) {
        _this.$message.error(error)
      })
    },
    // 模态框关闭
    changePeriod() {
      this.dialogFormVisible = false
    },
    // 全选
    handleCheckAllChange(val) {
      this.checkedCities = val ? cityOptions : []
      this.isIndeterminate = false
    },
    handleCheckedCitiesChange(value) {
      console.log(value)
      const checkedCount = value.length
      this.checkAll = checkedCount === this.cities.length
      this.isIndeterminate = checkedCount > 0 && checkedCount < this.cities.length
    },
    // 确定
    onSubmit(formName) {
      var _this = this
      this.$refs[`${formName}`].validate((valid) => {
        if (valid) {
          var BackupServerpath = ''
          var BackupServerpassword = ''
          var BackupServerip = ''
          var BackupServerusername = ''
          var str = ''
          var checkedCities = _this.checkedCities
          var autoStartTime = _this.form.startTime
          var autoEndTime = _this.form.endTime
          // //远程存储
          // if (_this.form.StorageMode === '1') {
          //   if (!_this.form.longRange) {
          //     this.$message.warning('远程服务器未选择！');
          //     return;
          //   }
          // }
          // 自动备份
          if (_this.form.BackupMode === '1') {
            _this.form.magnitude = '0'
            // for (var i = 0; i < checkedCities.length; i++) {
            //   str += checkedCities[i].id + ','
            // }
            checkedCities.forEach(item => {
              str += item.id + ','
            })
            // 去掉最后一个逗号(如果不需要去掉，就不用写)
            if (str.length > 0) {
              str = str.substr(0, str.length - 1)
            }
          }
          // 远程备份
          // for (let i = 0; i < _this.backupServer.length; i++) {
          //   if (_this.backupServer[i].id === _this.form.longRange) {
          //     BackupServerpath = _this.backupServer[i].path
          //     BackupServerpassword = _this.backupServer[i].password
          //     BackupServerip = _this.backupServer[i].ip
          //     BackupServerusername = _this.backupServer[i].username
          //   }
          // }
          _this.backupServer.forEach(item => {
            if (item.id === _this.form.longRange) {
              BackupServerpath = item.path
              BackupServerpassword = item.password
              BackupServerip = item.ip
              BackupServerusername = item.username
            }
          })
          var data = {
            'userId': parseInt(_this.userId),
            'backupPolicyid': _this.form.backupPolicyid,
            'retentionPolicyid': _this.form.retentionPolicyid,
            'dbCatalog': {
              'dcDbUserName': _this.DbDetail.dcDbUserName,
              'dcDbUserPassword': _this.DbDetail.dcDbUserPassword,
              'dcId': _this.DbDetail.dcId,
              'dcVip': _this.DbDetail.dcVip,
              'dcName': _this.DbDetail.dcName,
              'dcPort': _this.DbDetail.dcPort,
              'dcDbName': _this.DbDetail.dcDbName
            },
            'auto': parseInt(_this.form.BackupMode),
            'name': _this.form.Name,
            // "storageType": parseInt(_this.form.StorageMode),
            'backupServerInfo': {
              'path': BackupServerpath,
              'password': BackupServerpassword,
              'ip': BackupServerip,
              'id': _this.form.longRange,
              'username': BackupServerusername
            },
            'autoBackupInfo': {
              // 保留时长
              'duration': _this.form.daynum,
              'increRate': _this.form.increRate,
              // "zone": _this.form.timeZone,
              // 备份周期
              'backupPeriod': {
                'date': str,
                'type': 1
              },
              // 备份时间段
              'backupWinow': {
                'startTime': autoStartTime.substring(0, 2),
                'endTime': autoEndTime.substring(0, 2)
              }
            },
            'syncType': _this.form.magnitude,
            'type': parseInt(_this.form.BackupType)
          }
          _this.buttonLoading = true
          this.axios({
            url: '/backup',
            method: 'post',
            data: data
          }).then((res) => {
            if (res.data.resultcode === 0) {
              _this.buttonLoading = false
              this.$router.push({
                path: '/nested/menu1/menu1-2'
              })
            } else {
              _this.buttonLoading = false
              this.$message.error(res.data.message)
              return false
            }
          })
        }
      })
    },
    // 取消
    onCancel() {
      this.$router.go(-1)
    },
    // 扩容
    JumpToExpand() {
      this.$router.push({
        path: '/DBExpansion',
        name: 'DBExpansion'
      })
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

  .button-expand {
    width: 80px;
    background-color: #409eff;
    border: none;
    color: aliceblue;
    padding: 7px;
    font-size: 14px;
    border-radius: 20px;
    outline: none;
  }
</style>
