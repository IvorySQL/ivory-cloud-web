<template>
  <div class="app-container">
    <el-row style="padding-bottom: 20px;float: right;">
      <el-button type="primary" icon="el-icon-circle-plus-outline" @click="dialogFormVisible = true">我要反馈</el-button>
      <el-button type="" @click="onCancel">返回</el-button>
    </el-row>
    <el-table v-loading="listLoading" :data="list" element-loading-text="Loading" border fit highlight-current-row>
      <!--      <el-table-column align="center" label="ID" width="95">-->
      <!--        <template slot-scope="scope">-->
      <!--          {{ scope.row.commentId }}-->
      <!--        </template>-->
      <!--      </el-table-column>-->
      <el-table-column label="用户名" align="center" width="200">
        <template slot-scope="scope">
          {{ scope.row.userName }}
        </template>
      </el-table-column>
      <el-table-column label="我的意见" align="center" show-overflow-tooltip>
        <template slot-scope="scope">
          <span>{{ scope.row.message }}</span>
        </template>
      </el-table-column>
      <el-table-column class-name="status-col" label="意见状态" align="center" width="180">
        <template slot-scope="scope">
          <el-tag :type="scope.row.status | statusFilter">
            {{ scope.row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="150">
        <template slot-scope="{ row }">
          <!--          <el-button type="primary" size="mini" @click="handleEdit(row)">编辑-->
          <!--          </el-button>-->
          <el-button type="primary" size="mini" @click="handleView(row)">查看
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!--    模态框-->
    <el-dialog title="意见反馈" :visible.sync="dialogFormVisible">
      <el-form
        ref="form"
        :model="feedbackform"
        :rules="feedbackRules"
        aria-autocomplete="on"
      >
        <el-form-item prop="message">
          <el-input
            v-model="feedbackform.message"
            type="textarea"
            :autosize="{minRows:6, maxRows:10}"
            placeholder="如果您想对我们的产品提出意见或建议，请在这里填写，您的反馈是我们前进的动力！"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="postComment('form')">确 定</el-button>
          <el-button @click="handleEditCancel">取 消</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
    <el-dialog title="我的意见" :visible.sync="dialogFormVisible2" :before-close="handleClose">
      <el-form
        ref="form"
        :model="feedbackform"
        :rules="feedbackRules"
        aria-autocomplete="on"
      >
        <el-form-item prop="message">
          <el-input
            v-model="feedbackform.message"
            disabled=""
            type="textarea"
            :autosize="{minRows:6, maxRows:10}"
            placeholder="如果您想对我们的产品提出意见或建议，请在这里填写，您的反馈是我们前进的动力！"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item>
          <el-button @click="handleViewCancel">
            关闭
          </el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script>
export default {
  filters: {
    statusFilter(status) {
      const statusMap = new Map()
      statusMap.set('published', 'success')
      statusMap.set('draft', 'gray')
      statusMap.set('deleted', 'danger')
      return statusMap.get(status)
    }
  },
  data() {
    return {
      userId: '',
      list: [],
      listLoading: false,
      dialogFormVisible: false,
      dialogFormVisible2: false,
      feedbackform: {
        message: ''
      },
      feedbackRules: {
        message: [{ required: true, trigger: 'blur', message: '输入内容不能为空！' }]
      }
    }
  },
  mounted() {
    var userId = localStorage.getItem('userId')
    if (!userId) {
      userId = localStorage.getItem('userId')
    }
    this.userId = userId
    this.getTableList()
  },
  methods: {
    handleEdit(row) {
      this.dialogFormVisible = true
      this.feedbackform.message = row.message
    },
    handleEditCancel() {
      this.feedbackform.message = ''
      this.dialogFormVisible = false
    },
    handleClose(done) {
      this.feedbackform.message = ''
      this.dialogFormVisible2 = false
    },
    handleView(row) {
      this.dialogFormVisible2 = true
      this.feedbackform.message = row.message
    },
    handleViewCancel() {
      this.feedbackform.message = ''
      this.dialogFormVisible2 = false
    },
    getTableList() {
      const _this = this
      this.listLoading = true
      this.axios.get('/getComments', {
        params: {
          userId: _this.userId
        }
      }).then(res => {
        this.listLoading = false
        if (res.data) {
          _this.list = res.data
        }
      }).catch(function(error) {
        _this.$message.error(error)
      })
    },
    // 增加备份服务器
    postComment(formName) {
      var _this = this
      this.$refs[`${formName}`].validate((valid) => {
        if (valid) {
          this.axios.post('/postComment', {
            userId: _this.userId,
            message: _this.feedbackform.message
          }).then(res => {
            if (res.data.success) {
              this.$message.success('提交成功！')
              this.dialogFormVisible = false
              this.feedbackform.message = ''
              this.getTableList()
            }
          }).catch(function(error) {
            _this.$message.error(error)
          })
        } else {
          // this.$message.error('请检查输入是否正确！');
          return false
        }
      })
    },
    onCancel() {
      const _this = this
      _this.$router.go(-1)
    }
  }
}
</script>
