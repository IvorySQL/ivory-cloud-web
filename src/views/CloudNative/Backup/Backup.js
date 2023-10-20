/**
 * In Backup/index.vue
 * @param row
 */
export function getBackupInfo(row) {
  const _this = this
  const instanceId = row.id
  const instanceName = row.name
  const clusterName = row.clusterName
  const namespace = row.namespace
  _this.backupVisible = true
  _this.instanceId = instanceId
  _this.instanceName = instanceName
  _this.clusterName = clusterName
  _this.namespace = namespace
}

/**
 * In BackupDialog.vue
 */
export function createBackup(formName) {
  const _this = this
  this.$refs[`${formName}`].validate((valid) => {
    if (valid) {
      this.$confirm('请牢记此次备份的数据库系统管理员密码，一旦忘记，恢复后将无法登录数据库', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        closeOnClickModal: false,
        type: 'warning'
      }).then(() => {
        _this.isButtonLoading = true
        this.axios.post('/instances/' + _this.instanceId + '/backups',
          {
            'description': _this.backupForm.description,
            'name': _this.backupForm.name
          },
          { headers: { 'Content-Type': 'application/json; charset=UTF-8' }}).then(res => {
          if (res.data.status === 'PROCESSING') {
            _this.$message.success('下发指令成功，正在备份中...')
            setTimeout(() => { _this.$parent.getTableList() }, 300)
            _this.backupVisible = false
          } else {
            _this.$message.error(res.data.message + '！')
            _this.isButtonLoading = false
          }
        }).catch(function(error) {
          _this.$message.error(error)
          _this.isButtonLoading = false
        })
      }).catch(() => {})
    } else {
      _this.isButtonLoading = false
      this.$message.error('请检查输入是否正确！')
      return false
    }
  })
}

/**
 * BackupDialog.vue
 */
export function resetForm(formName) {
  const _this = this
  _this.$refs[`${formName}`].resetFields()
  _this.$emit('update:visible', false)
  _this.$emit('update:instanceId', '')
  _this.$emit('update:instanceName', '')
  _this.$emit('update:clusterName', '')
  _this.$emit('update:namespace', '')
  _this.isButtonLoading = false
}
