<template>
  <div class="app-container">
    <el-row style="padding-bottom: 20px;">
      <el-button
        v-if="checkPermission(['admin'])"
        type="primary"
        icon="el-icon-circle-plus-outline"
        @click="openAddDialog()"
      >增加Kubernetes集群
      </el-button>
    </el-row>
    <el-table
      v-loading="listLoading"
      :data="list"
      element-loading-text="Loading"
      border
      fit
      highlight-current-row
    >
      <el-table-column label="服务器地址" align="center">
        <template slot-scope="scope">
          {{ scope.row.serverUrl }}
        </template>
      </el-table-column>
      <el-table-column label="集群名称" align="center">
        <template slot-scope="scope">
          {{ scope.row.clusterName }}
        </template>
      </el-table-column>
      <el-table-column label="用户名" align="center">
        <template slot-scope="scope">
          {{ scope.row.serverUser }}
        </template>
      </el-table-column>
      <el-table-column label="连接端口" align="center">
        <template slot-scope="scope">
          {{ scope.row.serverSshport }}
        </template>
      </el-table-column>

      <el-table-column align="center" prop="created_at" label="配置路径">
        <template slot-scope="scope">
          {{ scope.row.configPath }}
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="240">
        <template slot-scope="scope">
          <el-button type="primary" size="mini" @click="viewBms(scope.row)">查看
          </el-button>
          <el-button v-if="checkPermission(['admin'])" type="primary" size="mini" @click="editBms(scope.row)">编辑
          </el-button>
          <el-button v-if="checkPermission(['admin'])" type="primary" size="mini" @click="deleteBms(scope.row)">删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!--    模态框-->
    <el-dialog title="Kubernetes集群服务器" :visible.sync="dialogFormVisible" @close="resetForm">
      <el-form
        ref="editForm"
        :model="editForm"
        :rules="rules"
        aria-autocomplete="on"
      >
        <el-form-item v-show="editFlag || viewFlag" label="集群ID：" label-width="150px" prop="clusterId">
          {{ editForm.clusterId }}
        </el-form-item>
        <el-form-item label="服务器地址：" label-width="150px" prop="serverUrl">
          <el-input v-model="editForm.serverUrl" :disabled="viewFlag" size="small" />
        </el-form-item>
        <el-form-item label="集群名称：" label-width="150px" prop="clusterName">
          <el-input v-model="editForm.clusterName" :disabled="viewFlag" size="small" />
        </el-form-item>
        <el-form-item label="用户：" label-width="150px" prop="serverUser">
          <el-input v-model="editForm.serverUser" :disabled="viewFlag" size="small" />
        </el-form-item>
        <el-form-item label="密码：" label-width="150px" prop="serverPass">
          <el-input
            :key="passwordType"
            v-model="editForm.serverPass"
            :disabled="viewFlag"
            :type="passwordType"
            size="small"
          />
          <span class="show-pwd" @click="showPwd"><svg-icon
            :icon-class="passwordType === 'password' ? 'eye' : 'eye-open'"
          /></span>
        </el-form-item>
        <el-form-item label="端口号：" label-width="150px" prop="serverSshport">
          <el-input v-model="editForm.serverSshport" :disabled="viewFlag" size="small" />
        </el-form-item>
        <el-form-item label="配置文件路径：" label-width="150px" prop="configPath">
          <el-input v-model="editForm.configPath" :disabled="viewFlag" size="small" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button v-if="editFlag||addFlag||!viewFlag" type="primary" :loading="isButtonLoading" @click="handleSure('editForm')">确 定</el-button>
        <el-button v-if="editFlag||addFlag||!viewFlag" @click="dialogFormVisible = false">取 消</el-button>
        <el-button v-if="viewFlag" @click="dialogFormVisible = false">关 闭</el-button>
      </div>
    </el-dialog>
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
</style>
<script>
import checkPermission from '@/utils/permission' // 权限判断函数
export default {
  data() {
    return {
      isButtonLoading: false,
      row: {},
      addFlag: false,
      editFlag: false,
      viewFlag: false,
      passwordType: 'password',
      list: [],
      listLoading: false,
      dialogFormVisible: false,
      k8sClusterForm: {
        serverPass: '',
        clusterName: '',
        serverUrl: '',
        serverUser: '',
        serverSshport: '22',
        configPath: '/root/.kube/config',
        clusterId: ''
      },
      editForm: {
        serverPass: '',
        clusterName: '',
        serverUrl: '',
        serverUser: '',
        serverSshport: '22',
        configPath: '/root/.kube/config',
        clusterId: ''
      },
      rules: {
        clusterName: [{ required: true, trigger: 'blur', message: '集群名称不能为空！' }],
        serverUrl: [{ required: true, trigger: 'blur', message: '服务器地址不能为空！' }],
        serverUser: [{ required: true, trigger: 'blur', message: '用户名不能为空！' }],
        serverPass: [{ required: true, trigger: 'blur', message: '密码不能为空！' }],
        serverSshport: [{ required: true, trigger: 'blur', message: '端口号不能为空！' }],
        configPath: [{ required: true, trigger: 'blur', message: '配置文件路径不能为空！' }]
      }
    }
  },
  mounted() {
    this.getTableList()
    this.setTimer()
  },
  beforeDestroy() {
    var _this = this
    window.clearInterval(_this.clock)
    _this.clock = null
  },
  methods: {
    resetForm() {
      const _this = this
      this.$refs.editForm.resetFields()
      _this.resetEditForm(_this.k8sClusterForm)
    },
    openAddDialog() {
      const _this = this
      _this.dialogFormVisible = true
      _this.addFlag = true
      _this.editFlag = false
      _this.viewFlag = false
      _this.resetEditForm(_this.k8sClusterForm)
    },
    resetEditForm(form) {
      const _this = this
      _this.editForm.serverPass = form.serverPass
      _this.editForm.clusterName = form.clusterName
      _this.editForm.serverUrl = form.serverUrl
      _this.editForm.serverUser = form.serverUser
      _this.editForm.serverSshport = form.serverSshport
      _this.editForm.configPath = form.configPath
      _this.editForm.clusterId = form.clusterId
      _this.isButtonLoading = false
    },
    viewBms(row) {
      const _this = this
      _this.viewFlag = true
      _this.editFlag = false
      _this.addFlag = false
      _this.dialogFormVisible = true
      _this.resetEditForm(row)
    },
    editBms(row) {
      const _this = this
      _this.editFlag = true
      _this.viewFlag = false
      _this.addFlag = false
      _this.dialogFormVisible = true
      _this.resetEditForm(row)
    },
    edithandleSure() {
      var _this = this
      this.axios({
        url: '/clusters/update',
        method: 'post',
        data: {
          'id': _this.row.id,
          'serverUrl': _this.editForm.serverUrl,
          'clusterName': _this.editForm.clusterName,
          'serverUser': _this.editForm.serverUser,
          'serverPass': _this.editForm.serverPass,
          'serverSshport': _this.editForm.serverSshport,
          'configPath': _this.editForm.configPath,
          'clusterId': _this.editForm.clusterId
        }
      }).then((res) => {
        if (res.status === 200) {
          this.$message.success('下发指令成功，正在修改中...')
          _this.dialogFormVisible = false
          _this.row = {}
          _this.editFlag = false
          _this.editForm = _this.k8sClusterForm
          _this.getTableList()
        } else {
          this.$message.error(res.data.message)
          _this.isButtonLoading = false
          return false
        }
      }).catch(function(error) {
        this.$message.error(error)
        _this.isButtonLoading = false
      })
    },
    addhandleSure() {
      var _this = this
      _this.viewFlag = false
      _this.editFlag = false
      _this.addFlag = true
      this.axios({
        url: '/clusters/add',
        method: 'post',
        data: {
          'serverUrl': _this.editForm.serverUrl,
          'clusterName': _this.editForm.clusterName,
          'serverUser': _this.editForm.serverUser,
          'serverPass': _this.editForm.serverPass,
          'serverSshport': _this.editForm.serverSshport,
          'configPath': _this.editForm.configPath
        }
      }).then((res) => {
        if (res.status === 200) {
          _this.addFlag = false
          _this.viewFlag = false
          _this.editFlag = false
          this.$message.success('下发指令成功，正在添加中...')
          _this.dialogFormVisible = false
          _this.editForm = _this.k8sClusterForm
          _this.getTableList()
        } else {
          this.$message.error(res.data.message)
          _this.isButtonLoading = false
          return false
        }
      }).catch(function(error) {
        this.$message.error(error)
        _this.isButtonLoading = false
      })
    },
    deleteBms(row) {
      const _this = this
      _this.editForm.clusterId = row.clusterId
      this.$confirm('此操作将删除该集群, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.axios({
          url: '/clusters/' + _this.editForm.clusterId,
          method: 'delete'
        }).then((res) => {
          if (res.status === 200) {
            _this.$message.success('下发指令成功，正在删除中...')
            _this.getTableList()
          }
        }).catch(function(error) {
          _this.$message.error(error)
        })
      }).catch(() => {
      })
    },
    showPwd() {
      if (this.passwordType === 'password') {
        this.passwordType = ''
      } else {
        this.passwordType = 'password'
      }
    },
    setTimer() {
      var _this = this
      _this.clock = window.setInterval(() => {
        _this.getTableList2()
      }, 10000)
    },
    getTableList2() {
      const _this = this
      this.axios.get('/clusters').then(res => {
        _this.list = res.data
      }).catch(function(error) {
        _this.$message.error(error)
      })
    },
    getTableList() {
      const _this = this
      this.listLoading = true
      this.axios.get('/clusters').then(res => {
        this.listLoading = false
        _this.list = res.data
      }).catch(function(error) {
        _this.$message.error(error)
      })
    },
    // 确定按钮
    handleSure(formName) {
      var _this = this
      this.$refs[`${formName}`].validate((valid) => {
        if (valid) {
          _this.isButtonLoading = true
          if (_this.addFlag) {
            _this.addhandleSure()
          } else if (_this.editFlag) {
            _this.edithandleSure()
          }
        } else {
          this.$message.error('请检查输入是否正确！')
          return false
        }
      })
    },
    checkPermission
  }
}
</script>
