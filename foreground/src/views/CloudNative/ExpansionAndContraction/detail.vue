<template>
  <div class="app-container">
    <el-row style="padding-bottom: 20px;">
      <span style="margin-right: 20px;font-weight: 700;font-size: 16px;">状态</span>
      <el-switch
        v-model="status"
        active-color="#13ce66"
        inactive-color="#ff4949"
        @change="switchStatus"
      />
    </el-row>
    <el-table
      v-loading="listLoading"
      :data="list"
      element-loading-text="Loading"
      border
      fit
      highlight-current-row
    >
      <el-table-column label="名称" align="center">
        <template slot-scope="scope">
          {{ scope.row.alertName }}
        </template>
      </el-table-column>
      <el-table-column label="阙值" align="center">
        <template slot-scope="scope">
          {{ scope.row.rule }}
        </template>
      </el-table-column>
      <el-table-column label="时间" align="center">
        <template slot-scope="scope">
          {{ scope.row. threshold }}
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="240">
        <template slot-scope="scope">
          <el-button :disabled="!status" type="primary" size="mini" @click="editBms(scope.row)">编辑
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-row style="padding-top: 20px">
      <el-button type="primary" :disabled="!status" :loading="submitStatus" @click="submitRules">提交</el-button>
    </el-row>
    <!--    模态框-->
    <el-dialog title="扩缩容规则" :visible.sync="dialogFormVisible">
      <el-form
        ref="editForm"
        :model="editForm"
        :rules="rules"
        aria-autocomplete="on"
      >
        <el-form-item label="名称：" label-width="150px">
          {{ editForm.alertName }}
        </el-form-item>
        <el-form-item label="阙值：" label-width="150px" prop="duration">
          {{ editForm.type }}&nbsp;{{ getConditionals }}&nbsp;<el-input
            v-model="editForm.duration"
            style="width: 50px"
            size="small"
          />
        </el-form-item>
        <el-form-item label="时间：" label-width="150px" prop="threshold">
          <el-input v-model="editForm.threshold" style="width: 80px" size="small" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="handleSure">确 定</el-button>
        <el-button @click="handleCancel">取 消</el-button>
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
      submitStatus: false,
      status: true,
      isButtonLoading: false,
      row: {},
      addFlag: false,
      editFlag: false,
      viewFlag: false,
      list: [],
      listLoading: false,
      dialogFormVisible: false,
      editForm: {
        id: '',
        alertName: '',
        type: '',
        conditionals: '',
        duration: '',
        threshold: ''
      },
      userId: '',
      clusterId: '',
      rules: {
        duration: [{ required: true, trigger: 'blur', message: '阙值不能为空！' }],
        threshold: [{ required: true, trigger: 'blur', message: '时间不能为空！' }]
      },
      form: '',
      ruleitem: {
        id: '',
        duration: '',
        threshold: ''
      },
      ruleList: []
    }
  },
  mounted() {
    this.userId = localStorage.getItem('userId')
    this.clusterId = this.$route.query.clusterId
    this.getTableList()
  },
  beforeDestroy() {

  },
  methods: {
    switchStatus() {
      var switchStatus = ''
      if (this.status) {
        switchStatus = 'ON'
      } else {
        switchStatus = 'OFF'
      }
      this.axios({
        url: '/autoscaling/' + this.userId + '/' + this.clusterId + '/action',
        method: 'post',
        data: {
          'switchStatus': switchStatus
        }
      }).then((res) => {
        if (res.data.success) {
          if (this.status) {
            this.$message.success('开启成功！')
          } else {
            this.$message.success('关闭成功！')
          }
        } else {
          this.$message.error('修改状态失败！')
        }
      }).catch(function(error) {
        this.$message.error(error)
      })
    },
    editBms(row) {
      const _this = this
      _this.dialogFormVisible = true
      _this.row = row
      _this.resetEditForm(row)
    },
    resetEditForm(form) {
      const _this = this
      _this.editForm.id = form.id
      _this.editForm.alertName = form.alertName
      _this.editForm.type = form.type
      _this.editForm.conditionals = form.conditionals
      _this.editForm.duration = form.duration
      _this.editForm.threshold = form.threshold
    },
    handleCancel() {
      this.dialogFormVisible = false
      this.resetEditForm(this.form)
    },
    AddChecked(arr) {
      arr.map(item => {
        if (item.conditionals === 'GT') {
          item.rule = item.type + '>' + item.duration
        } else if (item.conditionals === 'LT') {
          item.rule = item.type + '<' + item.duration
        }
      })
      return arr
    },
    // 确定按钮
    handleSure() {
      var _this = this
      this.dialogFormVisible = false
      var ruleitem = {}
      _this.row.duration = parseInt(_this.editForm.duration)
      _this.row.threshold = parseInt(_this.editForm.threshold)
      ruleitem.id = _this.editForm.id
      ruleitem.duration = parseInt(_this.editForm.duration)
      ruleitem.threshold = parseInt(_this.editForm.threshold)
      _this.ruleList = _this.ruleList.filter(item => item.id !== ruleitem.id)
      _this.list = _this.list.filter(item => item.id !== ruleitem.id)
      _this.ruleList.push(ruleitem)
      _this.list.push(_this.row)
      this.AddChecked(_this.list)
      console.log(_this.ruleList)
    },
    submitRules() {
      var _this = this
      this.submitStatus = true
      this.axios.post('/autoscaling/alert-rule', _this.ruleList)
        .then(function(response) {
          console.log(response)
          if (response.data !== null) {
            _this.submitStatus = false
            _this.$message.success('修改成功！')
            _this.getTableList()
          }
        })
        .catch(function(error) {
          this.$message.error(error)
        })
    },
    getTableList() {
      const _this = this
      this.listLoading = true
      this.axios.get('/autoscaling/' + _this.userId + '/' + _this.clusterId).then(res => {
        if (res.data.autoscalingSwitch === 'ON') {
          _this.status = true
        } else {
          _this.status = false
        }
        _this.getRuleList()
      }).catch(function(error) {
        _this.$message.error(error)
      })
    },
    getRuleList() {
      const _this = this
      this.listLoading = true
      this.axios.get('/autoscaling/' + _this.userId + '/' + _this.clusterId + '/alert-rule').then(res => {
        this.listLoading = false
        var list = _this.AddChecked(res.data)
        this.list = list
      }).catch(function(error) {
        _this.$message.error(error)
      })
    },
    checkPermission,
    getConditionals() {
      return this.editForm.conditionals === 'GT' ? '>' : '<'
    }
  }
}
</script>
