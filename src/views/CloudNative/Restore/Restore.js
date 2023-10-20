export function getBackupLists(row) {
  const _this = this
  const instanceId = row.id
  const instanceName = row.name
  const clusterName = row.clusterName
  const namespace = row.namespace
  _this.restoreVisible = true
  _this.clusterId = row.clusterId
  this.axios.get('/instances/' + instanceId + '/backups/1/1000?filter=', {})
    .then((response) => {
      _this.listLoading = false
      _this.backupLists = response.data.data
      _this.instanceId = instanceId
      _this.instanceName = instanceName
      _this.clusterName = clusterName
      _this.namespace = namespace
    })
    .catch((error) => {
      this.$message.error(error)
    })
}

export function recovery(row) {
  const _this = this
  const id = row.id
  const instanceId = row.instanceId
  this.$confirm('此操作将恢复备份文件' + row.name + ', 是否继续?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    closeOnClickModal: false,
    type: 'warning'
  }).then(() => {
    _this.restoreForm.originalBackupId = id
    _this.restoreForm.originalInstanceId = instanceId
    _this.restoreForm.clusterId = _this.clusterId
    const restoreForm = JSON.stringify(_this.restoreForm)
    sessionStorage.setItem(`restoreForm`, restoreForm)
    this.$router.push({ path: '/nativeCloud/DBInstance/index', query: { isRestore: _this.isRestore }})
  }).catch(() => {})
}

export function resetTable() {
  const _this = this
  _this.$emit('update:visible', false)
  _this.$emit('update:backupLists', [])
  _this.$emit('update:instanceId', '')
  _this.$emit('update:instanceName', '')
  _this.$emit('update:clusterName', '')
  _this.$emit('update:namespace', '')
}
