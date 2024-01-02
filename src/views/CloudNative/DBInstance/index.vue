<template>
  <div class="app-container">
    <el-form ref="form" :model="form" label-width="130px" :rules="rules" label-position="left">
      <div class="base-container">
        <el-row style="margin: 5px 0 20px; display: none">
          <span style="font-size: 20px;font-weight: 600">{{ form.resourceName }}</span>
        </el-row>
        <el-row style="display: none">
          <el-col :xs="24" :sm="24" :md="20" :lg="12" :xl="8">
            <el-form-item label="计费方式" prop="billingMethod">
              <el-select v-model="form.billingMethod" placeholder="请选择数据库安装配置" size="small" @change="changeMethod">
                <el-option
                  v-for="item in ChargingMode"
                  :key="item.id"
                  :disabled="item.id===2"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
              <el-select
                v-if="form.billingMethod===2"
                v-model="form.time"
                placeholder="请选择年/月"
                size="small"
                style="margin-left: 10px"
              >
                <el-option
                  v-for="item in Duration"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24" :md="20" :lg="12" :xl="8">
            <el-form-item label="自动续费">
              <el-switch v-model="form.renew" size="small" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :sm="24" :md="20" :lg="12" :xl="8">
            <el-form-item label="集群" prop="clusterName">
              <el-select
                ref="clusterName"
                class="selectCluster"
                v-model="form.clusterName"
                placeholder="请选择所在集群"
                size="small"
                :disabled="restoreForm.isRestore"
                @change="changeCluster"
              >
                <el-option
                  v-for="item in Cluster"
                  :key="item.clusterName"
                  :label="item.clusterName"
                  :value="item.clusterName"
                />
              </el-select>
              <span v-show="form.isRestore" style="padding-left: 30px;">
                <el-tooltip class="restoreHelp" effect="dark" content="恢复模式下，只能恢复数据库到原集群中。">
                  <i class="el-icon-question" />
                </el-tooltip>
              </span>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24" :md="20" :lg="12" :xl="8">
            <el-form-item label="命名空间" prop="namespace">
              <el-select ref="namespace" v-model="form.namespace" placeholder="请选择命名空间" size="small">
                <el-option
                  v-for="item in Namespace"
                  :key="item.metadata.uid"
                  :label="item.metadata.name"
                  :value="item.metadata.name"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="24" :md="20" :lg="12" :xl="8">
            <el-form-item label="数据库引擎" prop="resource">
              <el-form-item :label=form.dbtype />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24" :md="20" :lg="12" :xl="8">
            <el-form-item label="版本" prop="edition">
              <el-form-item :label=form.dbversion />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24" :md="20" :lg="12" :xl="8">
            <el-form-item label="实例类型" prop="type">
              <el-radio
                v-for="item in typelist"
                ref="typeChange"
                :key="item.id"
                v-model="form.type"
                :label="item.id"
                @change="typeChange"
              >
                {{ item.name }}
              </el-radio>
            </el-form-item>
          </el-col>
          <el-col v-show="form.isRestore" :xs="24" :sm="24" :md="20" :lg="12" :xl="8">
            <el-form-item label="恢复到实例" prop="restoreType">
              <el-radio
                v-for="item in restoreTypeList"
                :key="item.id"
                v-model="form.restoreType"
                :label="item.id"
                @change="toInstance"
              >
                {{ item.name }}
              </el-radio>
            </el-form-item>
          </el-col>
        </el-row>
      </div>
      <div class="base-container">
        <el-row>
          <el-col :xs="24" :sm="24" :md="20" :lg="12" :xl="8">
            <el-form-item label="实例名称" prop="name">
              <el-input class="inputName" v-model="form.name" size="small">
                <span slot="suffix">
                  <el-tooltip class="nameHelp" effect="dark" content="1-8个字符，只能以小写英文字母开头，名称只能包含小写英文字母、数字、“-”。">
                    <i class="el-icon-question" />
                  </el-tooltip>
                </span>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :sm="24" :md="20" :lg="12" :xl="8">
            <el-tooltip v-show="form.isRestore" class="restoreHelp" effect="dark" content="请输入此次备份时的数据库密码。">
              <el-form-item label="密码" prop="pass">
                <el-input  class="inputPwd" :key="passwordType" v-model="form.pass" :type="passwordType" size="small" />
                <span class="show-pwd" @click="showPwd"><svg-icon
                  :icon-class="passwordType === 'password' ? 'eye' : 'eye-open'"
                /></span>
              </el-form-item>
            </el-tooltip>
            <el-form-item v-show="!form.isRestore" label="密码" prop="pass">
              <el-input id="inputPwd" :key="passwordType" v-model="form.pass" :type="passwordType" size="small" />
              <span id="show-pwd1" class="show-pwd" @click="showPwd"><svg-icon
                :icon-class="passwordType === 'password' ? 'eye' : 'eye-open'"
              /></span>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :sm="24" :md="20" :lg="12" :xl="8">
            <el-form-item label="确认密码" prop="checkPass">
              <el-input  id="confirmPdw" :key="passwordType2" v-model="form.checkPass" :type="passwordType2" size="small" />
              <span  id="show-pwd2" class="show-pwd" @click="showPwd2"><svg-icon
                :icon-class="passwordType2 === 'password' ? 'eye' : 'eye-open'"
              /></span>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :sm="24" :md="20" :lg="12" :xl="8">
            <el-form-item label="实例描述" prop="desc">
              <el-input v-model="form.desc" type="textarea" size="small" />
            </el-form-item>
          </el-col>
        </el-row>
      </div>
      <div class="base-container">
        <el-row>
          <!-- 是裸金属和容器时，让用户填写cpu/memory大小-->
          <!-- form.serverId （1： 虚拟机；2：裸金属；3：容器) -->
          <el-col :xs="24" :sm="24" :md="20" :lg="12" :xl="8">
            <el-form-item label="CPU" prop="cpuNum">
              <el-input-number
                v-model="form.cpuNum"
                :min="1"
                :max="1024"
                label="描述文字"
                size="small"
                @change="getPrice"
              />
              <span>vCPUs</span>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24" :md="20" :lg="12" :xl="8">
            <el-form-item label="内存" prop="memorySize">
              <el-input-number
                v-model="form.memorySize"
                :min="1"
                :max="1024"
                label="描述文字"
                size="small"
                @change="getPrice"
              />
              <span>GiB</span>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24" :md="20" :lg="12" :xl="8">
            <el-form-item label="存储类型" prop="storageClass">
              <el-select ref="storageClass" v-model="form.storageClass" placeholder="请选择存储类型" size="small">
                <el-option
                  v-for="item in StorageClass"
                  :key="item.metadata.id"
                  :label="item.metadata.name"
                  :value="item.metadata.name"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24" :md="20" :lg="12" :xl="8">
            <el-form-item label="存储空间" prop="num">
              <el-input-number
                v-model="form.num"
                :min="1"
                :max="10240"
                label="描述文字"
                size="small"
                @change="getPrice"
              />
              <span>GiB</span>
            </el-form-item>
          </el-col>
        </el-row>
      </div>
      <div class="base-container" style="display: none">
        <el-row>
          <el-col :xs="24" :sm="24" :md="20" :lg="12" :xl="8">
            <el-form-item label="节点数量">
              <el-input-number
                v-model="form.purchaseNum"
                :min="1"
                :max="50"
                label="描述文字"
                size="small"
                @change="getPrice"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </div>
      <div class="base-container" style="display: none">
        <el-row>
          <el-col :xs="24" :sm="24" :md="20" :lg="12" :xl="8">
            <el-form-item label="预估费用">
              <span style="font-size: 18px">{{ form.price }}</span>
              &nbsp;
              <span>元/小时</span>
            </el-form-item>
          </el-col>
        </el-row>
      </div>
      <el-form-item>
        <el-button  class="onSubmit"  ref="submit" type="primary" icon="el-icon-edit" @click="onSubmit('form')">下一步：确认信息
        </el-button>
      </el-form-item>
    </el-form>
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
    margin: 0px 0 25px;
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
  name: 'DBInstance',
  data() {
    var validatePass = (rule, value, callback) => {
      if (value === '') {
        callback(new Error('请输入密码'))
      } else {
        // if (this.form.checkPass !== '' && value !== this.form.checkPass) {
        //   callback(new Error('两次输入密码不一致!'))
        // }
        if (this.form.checkPass !== '') {
          this.$refs.form.validateField('checkPass')
        }
        if (this.form.resource === 1) {
          // var reg = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?&])[A-Za-z\d$@$!%*?&]{8,10}/;
          var reg = /^(?=.*[\!@#\$%\^&\*\(\)])(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\!@#\$%\^&\*\(\)]{8,32}$/
          // var reg = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
          // var reg = /(?!.*\s)(?!^[\u4e00-\u9fa5]+$)(?!^[0-9]+$)(?!^[A-z]+$)(?!^[^A-z0-9]+$)^.{8,16}$/
          if (!reg.test(value)) {
            callback(new Error('密码需不少于八位且包含大小写字母和数字和特殊字符！'))
          }
        }
        callback()
      }
    }
    var validatePass2 = (rule, value, callback) => {
      if (value === '') {
        callback(new Error('请再次输入密码'))
      } else {
        if (value !== this.form.pass) {
          callback(new Error('两次输入密码不一致!'))
        }
        // if (this.form.resource == 1) {
        //   var reg = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?&])[A-Za-z\d$@$!%*?&]{8,10}/;
        //   // var reg = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
        //   // var reg = /(?!.*\s)(?!^[\u4e00-\u9fa5]+$)(?!^[0-9]+$)(?!^[A-z]+$)(?!^[^A-z0-9]+$)^.{8,16}$/
        //   if (!reg.test(value)) {
        //     callback(new Error('密码需不少于八位且包含大小写字母和数字和特殊字符！'))
        //   }
        // }
      }
      callback()
    }
    const validateName = (rules, value, callback) => {
      if (value === '') {
        callback(new Error('实例名称不能为空！'))
      } else {
        if (value !== '') {
          const reg = new RegExp('^[A-Za-z\\\u4e00-\\\u9fa5]+[\\\u4e00-\\\u9fa5_0-9A-Za-z._-]{0,7}$')
          // var reg = /^[A-Za-z\\u4e00-\\u9fa5]+[\\u4e00-\\u9fa5_0-9A-Za-z._-]{0,7}$/
          if (!reg.test(value)) {
            callback(new Error('1-8个字符，只能以小写英文字母开头，名称只能包含小写英文字母、数字、“-”。'))
          }
        }
        callback()
      }
    }
    const validateDesc = (rules, value, callback) => {
      if (value !== '') {
        const reg = new RegExp('^[\\\u4e00-\\\u9fa5_a-zA-Z0-9_.\\\\-]{0,128}$')
        // var reg = /^[\\u4e00-\\u9fa5_a-zA-Z0-9_.\\-]{0,128}$/
        if (!reg.test(value)) {
          callback(new Error('0-128个字符，描述仅包含字母、汉字、数字、"."或"-"。'))
        }
      }
      callback()
    }
    const validateVip = (rules, value, callback) => {
      if (this.form.type === 2) {
        if (value === '') {
          callback(new Error('vip不能为空！'))
        } else {
          callback()
        }
      }
    }
    const validateRestoreType = (rules, value, callback) => {
      if (this.form.isRestore) {
        if (value === '') {
          callback(new Error('恢复模式不能为空！'))
        }
      }
      callback()
    }
    return {
      typelist: [{
        id: 1,
        name: '单节点'
      }, {
        id: 2,
        name: '高可用'
      }],
      restoreTypeList: [{ id: 1, name: '原实例' }, { id: 2, name: '新实例' }],
      keyword: '',
      currentRowId: '',
      listLoading: false,
      viplist: [],
      vipInfo: {},
      dialogTableVisible: false,
      passwordType: 'password',
      passwordType2: 'password',
      loading: false,
      flag: false,
      backform: {},
      restoreForm: {},
      form: {
        typeName: '单节点',
        pass: '',
        checkPass: '',
        serverId: '2',
        billingMethod: 1,
        time: '',
        renew: false,
        nodenum: 3, // 节点个数
        name: '',
        supply: '',
        availableArea: '',
        edition: 1,
        region: '',
        type: 1,
        backupFlag: false,
        resource: 1,
        // eslint-disable-next-line no-undef
        resourceName: dbtype,
        // eslint-disable-next-line no-undef
        dbtype: dbtype,
        // eslint-disable-next-line no-undef
        dbversion: dbversion,
        desc: '',
        cpuId: 2,
        osId: 1,
        osType: 1,
        specifications: '',
        num: '5',
        cpuNum: '1',
        memorySize: '1',
        purchaseNum: '1',
        price: 0,
        vip: '',
        clusterId: '',
        clusterName: '',
        namespace: '',
        storageClass: '',
        originalInstanceId: '',
        originalBackupId: '',
        isRestore: false,
        restoreType: ''
      },
      rules: {
        pass: [
          { required: true, validator: validatePass, trigger: 'blur' }
        ],
        checkPass: [
          { required: true, validator: validatePass2, trigger: 'blur' }
        ],
        name: [
          { required: true, trigger: 'blur', validator: validateName }
        ],
        desc: [
          { required: false, trigger: 'blur', validator: validateDesc }
        ],
        vip: [
          { required: true, validator: validateVip, trigger: 'change' }
        ],
        billingMethod: [
          { required: true, message: '请选择计费方式', trigger: 'change' }
        ],
        resource: [
          { required: true, message: '请选择数据库引擎', trigger: 'change' }
        ],
        edition: [
          { required: true, message: '请选择版本', trigger: 'change' }
        ],
        type: [
          { required: true, message: '请选择实例类型', trigger: 'change' }
        ],
        specifications: [
          { required: true, message: '请选择性能规格', trigger: 'change' }
        ],
        cpuId: [
          { required: true, message: '请选择CPU类型', trigger: 'change' }
        ],
        osId: [
          { required: true, message: '请选择操作系统', trigger: 'change' }
        ],
        osType: [
          { required: true, message: '请选择操作系统版本', trigger: 'change' }
        ],
        num: [
          { required: true, message: '请选择存储空间', trigger: 'change' }
        ],
        cpuNum: [
          { required: true, message: '请输入CPU大小', trigger: 'change' }
        ],
        memorySize: [
          { required: true, message: '请输入内存大小', trigger: 'change' }
        ],
        clusterName: [
          { required: true, message: '请选择所在集群', trigger: 'change' }
        ],
        namespace: [
          { required: true, message: '请选择命名空间', trigger: 'change' }
        ],
        storageClass: [
          { required: true, message: '请选择存储类型', trigger: 'change' }
        ],
        restoreType: [
          { required: true, validator: validateRestoreType, trigger: 'change' }
        ]
      },
      ChargingMode: [],
      Duration: [],
      Provider: [],
      // eslint-disable-next-line no-undef
      Product: [{ id: 1, name: dbtype }],
      // eslint-disable-next-line no-undef
      Version: [{ id: 1, name: dbversion }],
      DeployMode: [{ id: 1, name: 'ALONE' }, { id: 2, name: 'HA' }],
      cpu: [],
      os: [],
      osType: [],
      Flavor: [],
      userId: '',
      userName: '',
      price: 0,
      Cluster: [],
      Namespace: [],
      StorageClass: []
    }
  },
  mounted() {
    var _this = this
    // 接收传参，登录用户权限
    if (this.$route.query.userId) {
      this.userId = this.$route.query.userId
    }
    // 接收传参，confirmOrder页面返回数据
    if (this.$route.query.flag) {
      _this.flag = true
      _this.getFormData()
    }
    // 接收传参，恢复新实例传入的id
    if (this.$route.query.isRestore) {
      _this.isRestore = true
      _this.form.restoreType = 1
      _this.getRestoreForm()
    }
    this.getCluster()
  },
  methods: {
    showPwd() {
      if (this.passwordType === 'password') {
        this.passwordType = ''
      } else {
        this.passwordType = 'password'
      }
    },
    showPwd2() {
      if (this.passwordType2 === 'password') {
        this.passwordType2 = ''
      } else {
        this.passwordType2 = 'password'
      }
    },
    handelVip() {
      this.getVip()
      this.dialogTableVisible = true
    },
    btnSearch() {
      if (this.keyword) {
        this.listLoading = true
        this.vipInfo = {}
        this.form.vip = ''
        this.currentRowId = ''
        this.axios.get('/getVipInfoByVip', {
          params: {
            vip: this.keyword
          }
        }).then((res) => {
          this.viplist = res.data
          this.listLoading = false
        })
          .catch(function(error) {
            this.$message.error(error)
          })
      } else {
        this.$message.warning('请输入要查询的VIP！')
      }
    },
    btnReset() {
      this.keyword = ''
      this.getVip()
      this.vipInfo = {}
      this.form.vip = ''
      this.currentRowId = ''
    },
    getVip() {
      this.listLoading = true
      this.axios.get('/getVipInfoUnused').then(res => {
        this.viplist = res.data
        this.listLoading = false
      }).catch(function(error) {
        this.$message.error(error)
      })
    },
    dialogSubmit() {
      this.form.vip = this.vipInfo.interIp
      this.dialogTableVisible = false
    },
    dialogCurrent() {
      this.dialogTableVisible = false
      this.vipInfo = {}
      this.form.vip = ''
      this.currentRowId = ''
      this.keyword = ''
    },
    // 获取集群信息
    getCluster(event) {
      const _this = this
      this.axios.get('/clusters').then(res => {
        if (res.data && res.data.length !== 0) {
          _this.Cluster = res.data
          // for (let i = 0; i < _this.Cluster.length; i++) {
          //   _this.form.clusterId = _this.Cluster[i].clusterId
          //   _this.form.clusterName = _this.Cluster[i].clusterName
          // }
          _this.Cluster.forEach((element) => {
            _this.form.clusterId = element.clusterId
            _this.form.clusterName = element.clusterName
          })
          if (!event && _this.flag) {
            _this.form.clusterId = _this.backform.clusterId
            _this.form.clusterName = _this.backform.clusterName
          }
          if (!event && _this.isRestore) {
            _this.form.clusterId = _this.restoreForm.clusterId
            // for (let i = 0; i < _this.Cluster.length; i++) {
            //   if (_this.Cluster[i].clusterId === _this.form.clusterId) {
            //     _this.form.clusterName = _this.Cluster[i].clusterName
            //   }
            // }
            _this.Cluster.forEach((element) => {
              if (element.clusterId === _this.form.clusterId) {
                _this.form.clusterName = element.clusterName
              }
            })
          }
          this.getNamespace(event)
        } else {
          this.$message({
            dangerouslyUseHTMLString: true,
            type: 'warning',
            message: '请先配置K8S集群信息！'
          })
        }
      }).catch(function(error) {
        _this.$message.error(error)
      })
    },
    // 获取命名空间
    getNamespace(event) {
      const _this = this
      this.axios.get('/clusters/' + _this.form.clusterId + '/namespace').then(res => {
        if (res.data && res.status === 200) {
          _this.Namespace = res.data
          // for (let i = 0; i < _this.Namespace.length; i++) {
          //   _this.form.namespace = _this.Namespace[i].metadata.name
          // }
          _this.Namespace.forEach((element) => {
            _this.form.namespace = element.metadata.name
          })
          if (!event && _this.flag) {
            _this.form.namespace = _this.backform.namespace
          }
        } else {
          _this.form.namespace = ''
          _this.Namespace = []
        }
      }).catch(function(error) {
        _this.$message.error(error)
        _this.form.namespace = ''
        _this.Namespace = []
      })
      _this.getStorageClass(event)
    },
    getStorageClass(event) {
      const _this = this
      this.axios.get('/storage-class', {
        params: {
          clusterId: _this.form.clusterId
        }
      }).then(res => {
        if (res.data && res.status === 200) {
          _this.StorageClass = res.data
          // for (let i = 0; i < _this.StorageClass.length; i++) {
          //   _this.form.storageClass = _this.StorageClass[i].metadata.name
          // }
          _this.StorageClass.forEach((element) => {
            _this.form.storageClass = element.metadata.name
          })
          if (!event && _this.flag) {
            _this.form.storageClass = _this.backform.storageClass
          }
        } else {
          _this.form.storageClass = ''
          _this.StorageClass = []
        }
      }).catch(function(error) {
        _this.$message.error(error)
        _this.form.storageClass = ''
        _this.StorageClass = []
      })
    },
    // 获取计费方式
    getChargingMode(event) {
      const _this = this
      this.axios.get('/getChargingMode', {
        params: {
          serverId: _this.form.serverId
        }
      }).then(res => {
        _this.ChargingMode = res.data.dataList
        _this.form.billingMethod = _this.ChargingMode[0].id
        if (!event && _this.flag) {
          _this.form.billingMethod = _this.backform.billingMethod
        }
      }).catch(function(error) {
        _this.$message.error(error)
      })
    },
    // 获取包年/月时长
    getDuration(event) {
      const _this = this
      this.axios.get('/getDuration', {
        params: {
          serverId: _this.form.serverId
        }
      }).then(res => {
        _this.Duration = res.data.dataList
      }).catch(function(error) {
        _this.$message.error(error)
      })
    },
    typeChange() {
      var _this = this
      if (_this.form.type === 2) {
        _this.form.typeName = '高可用'
        _this.form.nodenum = '3'
      } else {
        _this.form.typeName = '单节点'
        _this.form.nodenum = ''
        _this.form.vip = ''
      }
    },
    toInstance() {
      // var _this = this
    },
    // 获取CPU类型
    getCpu(event) {
      const _this = this
      this.axios.get('/getCPU', {
        params: {
          availableZoneId: _this.form.availableArea
        }
      }).then(res => {
        if (res.data.dataList) {
          _this.cpu = res.data.dataList
          // _this.form.cpuId = 2
          _this.form.cpuId = res.data.dataList[0].id
          if (_this.form.resource === 2 || _this.form.resource === 1) {
            res.data.dataList.forEach(t => {
              if (t.id === 2) {
                _this.form.cpuId = 2
              }
            })
          }
        }
        if (!event && _this.flag) {
          _this.form.cpuId = _this.backform.cpuId
        }
        _this.getOS(event)
        _this.getFlavor(event)
      }).catch(function(error) {
        this.$message.error(error)
      })
    },
    // 获取OS类型
    getOS(event) {
      const _this = this
      this.axios.get('/getOS', {
        params: {
          cpuId: _this.form.cpuId
        }
      }).then(res => {
        if (res.data.dataList) {
          _this.os = res.data.dataList
          _this.form.osId = 1
        }
        if (!event && _this.flag) {
          _this.form.osId = _this.backform.osId
        }
        _this.getOSVersion(event)
      }).catch(function(error) {
        this.$message.error(error)
      })
    },
    // 获取OS版本信息
    getOSVersion(event) {
      const _this = this
      this.axios.get('/getOSVersion', {
        params: {
          cpuId: _this.form.cpuId,
          osId: _this.form.osId
        }
      }).then(res => {
        if (res.data.dataList) {
          _this.osType = res.data.dataList
          _this.form.osType = _this.osType[0].id
        }
        if (!event && _this.flag) {
          _this.form.osType = _this.backform.osType
        }
      }).catch(function(error) {
        this.$message.error(error)
      })
    },
    // 获取规格
    getFlavor(event) {
      const _this = this
      var params = {}
      if (_this.form.cpuId) {
        params = {
          cpuId: _this.form.cpuId,
          datacenterId: _this.form.region
        }
      } else {
        params = {
          availableZoneId: _this.form.availableArea
        }
      }
      this.axios.get('/getFlavor', {
        params: params
      }).then((res) => {
        if (res.data.dataList) {
          _this.Flavor = res.data.dataList
          _this.form.specifications = _this.Flavor[0].name
          if (!event && _this.flag) {
            _this.form.specifications = _this.backform.specifications
          }
          _this.getPrice()
        }
      }).catch(function(error) {
        this.$message.error(error)
      })
    },
    // 下一步
    onSubmit(formName) {
      const _this = this
      this.$refs[`${formName}`].validate((valid) => {
        if (valid) {
          var ProductName
          var VersionName
          var typeName
          var deployMode
          // for (let i = 0; i < _this.Product.length; i++) {
          //   if (_this.Product[i].id === _this.form.resource) {
          //     ProductName = _this.Product[i].name
          //   }
          // }
          _this.Product.forEach((element) => {
            if (element.id === _this.form.resource) {
              ProductName = element.name
            }
          })
          // for (let i = 0; i < _this.Version.length; i++) {
          //   if (_this.Version[i].id === _this.form.edition) {
          //     var VersionName = _this.Version[i].name
          //   }
          // }
          _this.Version.forEach((element) => {
            if (element.id === _this.form.edition) {
              VersionName = element.name
            }
          })
          // for (let i = 0; i < _this.DeployMode.length; i++) {
          //   if (_this.DeployMode[i].id === _this.form.type) {
          //     typeName = _this.typelist[i].name
          //     deployMode = _this.DeployMode[i].name
          //   }
          // }
          _this.DeployMode.forEach((element) => {
            if (element.id === _this.form.type) {
              deployMode = element.name
            }
          })
          _this.typelist.forEach((element) => {
            if (element.id === _this.form.type) {
              typeName = element.name
            }
          })
          var userId = localStorage.getItem('userId')
          var userName = localStorage.getItem('userName')
          if (!userId) {
            userId = localStorage.getItem('userId')
            userName = localStorage.getItem('userName')
          }
          if (_this.userId) {
            userId = _this.userId
            userName = _this.userName
          }
          const confirmData = {
            'chargingMode': _this.form.billingMethod,
            'ClusterName': _this.form.clusterName,
            'NamespaceName': _this.form.namespace,
            'name': _this.form.name,
            'ProductName': ProductName,
            'VersionName': VersionName,
            'typeName': typeName,
            'description': _this.form.desc,
            'StorageClassName': _this.form.storageClass,
            'size': _this.form.num,
            'price': _this.form.price + '',
            'count': _this.form.purchaseNum + '',
            'userId': userId,
            'cpuNum': _this.form.cpuNum,
            'memorySize': _this.form.memorySize,
            'isRestore': _this.form.isRestore,
            'restoreType': _this.form.restoreType
          }
          // console.log(confirmData)
          // 单机
          let createForm = {
            'admin': 'sysdba',
            'clusterId': _this.form.clusterId,
            'cpu': _this.form.cpuNum,
            'description': _this.form.desc,
            'memory': _this.form.memorySize,
            'name': _this.form.name,
            'namespace': _this.form.namespace,
            'password': _this.form.pass,
            'storage': _this.form.num,
            'storageClass': _this.form.storageClass,
            'type': deployMode,
            'version': VersionName,
            'creator': userId,
            'creatorName': userName,
            'originalBackupId': _this.form.originalBackupId,
            'originalInstanceId': _this.form.originalInstanceId
          }
          // form.type==2 高可用
          if (_this.form.type === 2) {
            createForm = {
              'admin': 'sysdba',
              'clusterId': _this.form.clusterId,
              'cpu': _this.form.cpuNum,
              'description': _this.form.desc,
              'memory': _this.form.memorySize,
              'name': _this.form.name,
              'namespace': _this.form.namespace,
              'password': _this.form.pass,
              'storage': _this.form.num,
              'storageClass': _this.form.storageClass,
              'type': deployMode,
              'replicas': _this.form.nodenum,
              'version': VersionName,
              'creator': userId,
              'creatorName': userName,
              'originalBackupId': _this.form.originalBackupId,
              'originalInstanceId': _this.form.originalInstanceId
            }
          }
          // console.log(createForm)
          const str = JSON.stringify(createForm)
          const str2 = JSON.stringify(confirmData)
          const strform = JSON.stringify(_this.form)
          // 存储userId
          sessionStorage.setItem(`form`, strform)
          sessionStorage.setItem(`createForm`, str)
          sessionStorage.setItem(`confirmData`, str2)
          this.$router.push({ path: '/nativeCloud/ConfirmOrder/index' })
        } else {
          this.$message.error('请检查输入是否正确！')
          return false
        }
      })
    },
    // 获取价格
    getPrice() {
      // var _this = this
    },

    // 从confirmOrder页面返回时，在这个函数中做传参赋值回页面操作
    getFormData() {
      var form = {}
      form = sessionStorage.getItem('form')
      this.backform = JSON.parse(form)
      // console.log(this.backform)
      this.form.name = this.backform.name
      this.form.pass = this.backform.pass
      this.form.checkPass = this.backform.checkPass
      this.form.desc = this.backform.desc
      this.form.num = this.backform.num
      this.form.typeName = this.backform.typeName
      this.form.vip = this.backform.vip
      this.form.type = this.backform.type
      this.form.clusterId = this.backform.clusterId
      this.form.clusterName = this.backform.clusterName
      this.form.storageClass = this.backform.storageClass
      this.form.namespace = this.backform.namespace
      this.form.cpuNum = this.backform.cpuNum
      this.form.memorySize = this.backform.memorySize
      this.form.isRestore = this.backform.isRestore
      this.form.originalInstanceId = this.backform.originalInstanceId
      this.form.originalBackupId = this.backform.originalBackupId
    },
    getRestoreForm() {
      let form = {}
      form = sessionStorage.getItem('restoreForm')
      this.restoreForm = JSON.parse(form)
      this.form.isRestore = this.restoreForm.isRestore
      this.form.originalInstanceId = this.restoreForm.originalInstanceId
      this.form.originalBackupId = this.restoreForm.originalBackupId
      this.form.clusterId = this.restoreForm.clusterId
    },
    changeCluster() {
      const _this = this
      const event = 'change'
      // for (let i = 0; i < this.Cluster.length; i++) {
      //   if (this.form.clusterName === this.Cluster[i].clusterName) {
      //     this.form.clusterId = this.Cluster[i].clusterId
      //   }
      // }
      _this.Cluster.forEach((element) => {
        if (element.clusterName === _this.form.clusterName) {
          _this.form.clusterId = element.clusterId
        }
      })
      _this.getNamespace(event)
    },
    // 切换计费方式
    changeMethod() {
      const event = 'change'
      this.form.time = ''// 包年、月时间
      this.Duration = []
      this.getDuration(event)// 包年、月时间
    },
    changeCpu() {
      const event = 'change'
      this.form.osId = ''
      this.form.osType = ''
      this.form.specifications = ''
      this.os = []
      this.osType = []
      this.Flavor = []
      this.getOS(event)
      this.getFlavor(event)
    },
    changeOs() {
      const event = 'change'
      this.form.osType = ''
      this.osType = []
      this.getOSVersion(event)
    },
    changeFlavor() {
      if (this.form.specifications) {
        this.getPrice()
      }
    }
  }
}
</script>

