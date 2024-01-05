<template>
  <div>
    <div class="app-container">
      <el-button @click="onCancel">返回</el-button>
      <!--      数据库基本信息-->
      <div class="base-container">
        <el-form :data="form" label-width="130px" label="数据库基本信息" label-position="left">
          <el-col :xs="24" :sm="24" :md="24" :lg="12" :xl="8">
            <el-form-item label="实例名称" prop="colName">
              {{ list.name }}
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24" :md="24" :lg="12" :xl="8">
            <el-form-item label="实例ID" prop="instanceId">
              {{ list.id }}
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24" :md="24" :lg="12" :xl="8">
            <el-form-item label="实例类型" prop="colVersion">
              {{ list !== [] && list.type !== undefined ? (list.type==="ALONE" ? "单节点" : "高可用") : "" }}
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="24" :md="24" :lg="12" :xl="8">
            <el-form-item label="集群名称" prop="clusterName">
              {{ list.clusterName }}
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="24" :md="24" :lg="12" :xl="8">
            <el-form-item label="数据库引擎" prop="colProduct">
              <!--              {{ form.product }}-->
              {{ dbtype }}
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24" :md="24" :lg="12" :xl="8">
            <el-form-item label="版本" prop="colVersion">
              {{ list.version }}
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="24" :md="24" :lg="12" :xl="8">
            <el-form-item label="命名空间" prop="colName">
              {{ list.namespace }}
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24" :md="24" :lg="12" :xl="8">
            <el-form-item label="存储类型" prop="storageClass">
              {{ list.storageClass }}
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="24" :md="24" :lg="12" :xl="8">
            <el-form-item label="性能规格">
              {{ list.cpu }} vCPUs | {{ list.memory }} GiB
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24" :md="24" :lg="12" :xl="8">
            <el-form-item label="存储空间" prop="storageSize">
              {{ list.storage }} GiB
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="24" :md="24" :lg="12" :xl="8">
            <el-form-item label="创建时间"> {{ list.createdAt }}</el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24" :md="24" :lg="12" :xl="8">
            <el-form-item label="实例备注" prop="desc">
              {{ list.description }}&nbsp;
              <el-link :disabled="!allowModifyDesc">
                <i class="el-icon-edit" @click="editDescription" />
              </el-link>
            </el-form-item>
          </el-col>
        </el-form>
      </div>
      <!--      连接信息-->
      <div class="base-container2">
        <el-form label-width="130px" class="demo-ruleForm" label="数据库基本信息" label-position="left">
          <el-row>
            <el-col :xs="24" :sm="24" :md="24" :lg="12" :xl="8">
              <el-form-item label="数据库访问地址">
                {{ networkForm.nodeIp }}
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="24" :lg="12" :xl="8">
              <el-form-item label="数据库访问端口">
                {{ networkForm.nodePort }}
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :xs="24" :sm="24" :md="24" :lg="12" :xl="8">
              <el-form-item label="Service">
                {{ networkForm.service }}
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="24" :lg="12" :xl="8">
              <el-form-item label="数据库端口">
                {{ networkForm.port }}
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :xs="24" :sm="24" :md="24" :lg="12" :xl="8">
              <el-form-item label="节点个数">{{ instanceEvent.nodeNum }}
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="24" :lg="12" :xl="8">
              <el-form-item label="就绪节点个数">{{ instanceEvent.nodeReadyNum }}
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>

      <div class="base-container2">
        <el-form :data="form" label-width="130px" label="重置密码" label-position="left">
          <el-form-item>
            <el-table
              :data="userList"
              element-loading-text="Loading"
              border
              fit
              highlight-current-row
              class="detail-table"
            >
              <el-table-column align="center" label="系统管理员">
                <template slot-scope="scope">
                  {{ scope.row.name }}
                </template>
              </el-table-column>
              <el-table-column label="修改密码" align="center">
                <!--  eslint-disable-next-line vue/no-unused-vars-->
                <template slot-scope="{ row, $index }">
                  <el-link :disabled="!allowModifyPwd">
                    <i class="el-icon-edit" @click="resetDbUserPass(row)" />
                  </el-link>
                </template>
              </el-table-column>
            </el-table>
          </el-form-item>
        </el-form>
      </div>
    </div>
    <!--    修改密码对话框     -->
    <el-dialog
      title="修改密码"
      :visible.sync="resetDbUserPassVisible"
      :close-on-click-modal="false"
      @close="resetForm('diaform')"
    >
      <el-form ref="diaform" :model="diaform" :rules="diaformRule">
        <el-form-item label="用户名称" label-width="140px">
          {{ diaform.name }}
        </el-form-item>
        <el-form-item label="新密码" label-width="140px" prop="newpassword">
          <el-input
            :key="passwordType"
            v-model="diaform.newpassword"
            :type="passwordType"
            size="small"
            style="width: 70%"
          />
          <span class="show-pwd" @click="showPwd">
            <svg-icon :icon-class="passwordType === 'password' ? 'eye' : 'eye-open'" /></span>
        </el-form-item>
        <el-form-item label="确认密码" label-width="140px" prop="confirmnewpass">
          <el-input
            :key="confirmPwdType"
            v-model="diaform.confirmnewpass"
            :type="confirmPwdType"
            size="small"
            style="width: 70%"
          />
          <span class="show-pwd" @click="showConfirmPwd">
            <svg-icon :icon-class="confirmPwdType === 'password' ? 'eye' : 'eye-open'" /></span>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" :loading="isButtonLoading" @click="modifyPass('diaform')">确 定</el-button>
        <el-button @click="resetDbUserPassVisible = false">取 消</el-button>
      </div>
    </el-dialog>
    <!--    修改实例备注对话框     -->
    <el-dialog
      title="修改实例备注"
      :visible.sync="modifyDescVisible"
      :close-on-click-modal="false"
      @close="resetDescForm('descForm')"
    >
      <el-form ref="descForm" :model="descForm" :rules="descFormRule">
        <el-form-item label="实例名称" label-width="140px">{{ list.name }}
        </el-form-item>
        <el-form-item label="实例备注" label-width="140px" prop="newDesc">
          <el-input v-model="descForm.newDesc" type="textarea" size="small" style="width: 70%" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" :loading="isButtonLoading" @click="modifyDesc(descForm)">确 定</el-button>
        <el-button @click="modifyDescVisible = false">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>

export default {
  data() {
    const validatePassword = (rule, value, callback) => {
      var _this = this
      if (value === '') {
        callback(new Error('请输入密码'))
      } else {
        if (_this.diaform.confirmnewpass !== '') {
          this.$refs.diaform.validateField('confirmnewpass')
        }
        // var reg = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?&])[A-Za-z\d$@$!%*?&]{8,10}/;
        var reg = /^(?=.*[\!@#\$%\^&\*\(\)])(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\!@#\$%\^&\*\(\)]{8,32}$/
        // var reg = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
        // var reg = /(?!.*\s)(?!^[\u4e00-\u9fa5]+$)(?!^[0-9]+$)(?!^[A-z]+$)(?!^[^A-z0-9]+$)^.{8,16}$/
        if (!reg.test(value)) {
          callback(new Error('安全版密码需不少于八位且包含大小写字母和数字和特殊字符！'))
        }
        callback()
      }
    }
    const validateConfirmPass = (rule, value, callback) => {
      var _this = this
      if (value === '') {
        callback(new Error('请再次输入密码'))
      } else {
        if (value !== _this.diaform.newpassword) {
          callback(new Error('两次输入的密码不一致'))
        }
      }
      callback()
    }
    const validateDesc = (rule, value, callback) => {
      if (value === '') {
        callback(new Error('请输入实例备注'))
      } else {
        if (value !== '') {
          const reg = new RegExp('^[\\\u4e00-\\\u9fa5_a-zA-Z0-9_.\\\\-]{0,128}$')
          // var reg = /^[\\u4e00-\\u9fa5_a-zA-Z0-9_.\\-]{0,128}$/
          if (!reg.test(value)) {
            callback(new Error('0-128个字符，描述仅包含字母、汉字、数字、"."或"-"。'))
          }
        }
        callback()
      }
    }
    return {
      passwordType: 'password',
      confirmPwdType: 'password',
      flag: '',
      instanceId: '',
      form: {},
      diaform: {
        name: '',
        newpassword: '',
        confirmnewpass: ''
      },
      descForm: { newDesc: '' },
      diaformRule: {
        newpassword: [{ required: true, validator: validatePassword, trigger: 'blur' }],
        confirmnewpass: [{ required: true, validator: validateConfirmPass, trigger: 'blur' }]
      },
      descFormRule: { newDesc: [{ required: true, trigger: 'blur', validator: validateDesc }] },
      list: [],
      userList: [{
        name: 'sysdba'
      }, {
        name: 'syssso'
      }, {
        name: 'syssao'
      }],
      loading: true,
      modifyDescVisible: false,
      resetDbUserPassVisible: false,
      // newDesc: '',
      instanceEvent: {},
      network: [],
      networkForm: {
        nodeIp: '',
        nodePort: '',
        service: '',
        port: ''
      },
      isButtonLoading: false,
      allowModifyPwd: '',
      allowModifyDesc: false
    }
  },
  mounted() {
    this.instanceId = this.$route.query.instanceId
    this.flag = this.$route.query.flag
    this.getTableList()
    // this.getInstanceEvent();
  },
  computed: {
    dbtype() {
      // eslint-disable-next-line no-undef
      return dbtype
    }
  },
  methods: {
    getStatus() {
      const _this = this
      _this.allowModifyPwd = _this.list.status === 'RUNNING'
      // console.log(_this.allowModifyPwd)
    },
    resetForm(formName) {
      this.$refs[`${formName}`].resetFields()
      this.isButtonLoading = false
    },
    resetDescForm(formName) {
      this.$refs[`${formName}`].resetFields()
      this.descForm.newDesc = this.list.description
    },
    showPwd() {
      if (this.passwordType === 'password') {
        this.passwordType = ''
      } else {
        this.passwordType = 'password'
      }
    },
    showConfirmPwd() {
      if (this.confirmPwdType === 'password') {
        this.confirmPwdType = ''
      } else {
        this.confirmPwdType = 'password'
      }
    },
    editDescription() {
      if (this.allowModifyDesc) {
        this.modifyDescVisible = true
        this.isButtonLoading = false
        this.descForm.newDesc = this.list.description
      }
    },
    resetDbUserPass(row) {
      if (this.allowModifyPwd) {
        this.resetDbUserPassVisible = true
        this.isButtonLoading = false
        this.diaform.name = row.name
      }
    },
    modifyPass(formName) {
      var _this = this
      const password = _this.diaform.newpassword
      this.$refs[`${formName}`].validate((valid) => {
        if (valid) {
          _this.isButtonLoading = true
          this.axios.put('/instances/' + _this.list.id + '/users/' + _this.diaform.name +
              '/reset-password', { password }).then(res => {
            if (res.status === 200) {
              _this.$message.success('重置密码成功')
              _this.resetDbUserPassVisible = false
              _this.diaform.newpassword = ''
              _this.diaform.confirmnewpass = ''
            } else {
              _this.$message.error(res.data.message + '！')
              _this.isButtonLoading = false
            }
          }).catch(function(error) {
            _this.$message.error(error)
            _this.isButtonLoading = false
          })
        } else {
          return false
        }
      })
    },
    modifyDesc(formName) {
      const _this = this
      const description = _this.descForm.newDesc
      this.$refs[`${formName}`].validate((valid) => {
        if (valid) {
          _this.isButtonLoading = true
          this.axios.patch('/instances/' + _this.list.id + '/description', { description }).then(res => {
            this.listLoading = false
            if (res.status === 200) {
              _this.$message.success('修改实例描述成功')
              _this.modifyDescVisible = false
              _this.descForm.newDesc = description
            } else {
              _this.$message.error(res.data.message + '！')
              _this.isButtonLoading = false
            }
          }).catch(function(error) {
            _this.$message.error(error)
            _this.isButtonLoading = false
          })
          setTimeout(() => { _this.getTableList() }, 150)
        } else {
          return false
        }
      })
    },
    getTableList() {
      var _this = this
      this.loading = true
      let userId = localStorage.getItem('userId')
      if (!userId) {
        userId = localStorage.getItem('userId')
      }
      this.axios.get('/instances/' + _this.instanceId).then(res => {
        if (res.status === 200) {
          this.listLoading = false
          _this.list = res.data
          _this.getStatus()
          if (res.data.network !== null && res.data.network.length !== 0) {
            _this.network = res.data.network
            _this.networkForm.nodeIp = _this.network[0].nodeIp
            _this.networkForm.nodePort = _this.network[0].nodePort
            _this.networkForm.service = _this.network[0].service
            _this.networkForm.port = _this.network[0].port
          }
          _this.getInstanceEvent()
          _this.allowModifyDesc = true
        } else {
          _this.$message.error(res.data.message + '！')
        }
      }).catch(function(error) {
        _this.$message.error(error)
      })
    },
    getInstanceEvent() {
      var _this = this
      this.loading = true
      let userId = localStorage.getItem('userId')
      if (!userId) {
        userId = localStorage.getItem('userId')
      }
      this.axios.get('/instances/' + _this.instanceId + '/events').then(res => {
        this.listLoading = false
        _this.instanceEvent = res.data
      }).catch(function(error) {
        _this.$message.error(error)
      })
    },
    onCancel() {
      this.$router.go(-1)
    }
  }
}
</script>

<style scoped>
  .button-group {
    float: right;
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
    margin: 15px 0;
    border-radius: 10px;
    padding: 20px 15px 0px;
    overflow: hidden;
  }

  .base-container2 {
    background-color: #ffffff;
    margin: 30px 0;
    border-radius: 10px;
    padding: 30px 20px 15px;
    overflow: hidden;
  }

  .detail-table {
    width: 800px;
    float: left;
    margin: 0 auto;
  }

  #myChart {
    width: 50%;
    height: 300px;
    float: left;
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

