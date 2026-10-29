export function getSpecInfos(row) {
  this.modifySpecVisible = true
  const instanceId = row.id
  const instanceName = row.name
  const clusterName = row.clusterName
  const namespace = row.namespace
  const _this = this
  const specificationForm = { cpu: '', memory: '' }
  _this.specificationForm = specificationForm
  this.axios.get('/instances/' + instanceId, {})
    .then((response) => {
      if (!_this.modifySpecVisible || _this.specificationForm !== specificationForm) return
      _this.listLoading = false
      _this.specificationForm.cpu = response.data.cpu
      _this.specificationForm.memory = response.data.memory
      _this.instanceId = instanceId
      _this.instanceName = instanceName
      _this.clusterName = clusterName
      _this.namespace = namespace
    })
    .catch((error) => {
      if (!_this.modifySpecVisible || _this.specificationForm !== specificationForm) return
      this.$message.error(error)
    })
}
export function modifySpecs(updateForm) {
  const _this = this
  const specificationForm = _this.specificationForm
  this.$refs[`${updateForm}`].validate((valid) => {
    if (valid) {
      _this.isButtonLoading = true
      this.axios.post('/instances/' + _this.instanceId + '/action/modify-spec',
        {
          'cpu': _this.updateForm.cpu,
          'memory': _this.updateForm.memory
        },
        { headers: { 'Content-Type': 'application/json; charset=UTF-8' }}).then(res => {
        if (!_this.modifySpecVisible || _this.specificationForm !== specificationForm) return
        if (res.status === 200) {
          _this.$message.success('下发指令成功，正在修改中...')
          setTimeout(() => { _this.$parent.getTableList() }, 300)
          _this.modifySpecVisible = false
        } else {
          _this.$message.error(res.data.message + '！')
          _this.isButtonLoading = false
        }
      }).catch(function(error) {
        if (!_this.modifySpecVisible || _this.specificationForm !== specificationForm) return
        _this.$message.error(error)
        _this.isButtonLoading = false
      })
    } else {
      _this.isButtonLoading = false
      this.$message.error('请检查输入是否正确！')
      return false
    }
  })
}

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
