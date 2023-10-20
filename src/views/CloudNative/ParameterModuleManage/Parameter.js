export function handleClick(row) {
  const _this = this
  // 动态设置数据并通过这个数据判断显示方式
  if (row.isEdit) {
    this.$delete(row, 'isEdit')
    if (_this.validateInput(row)) {
      _this.allowCommit = true
    } else {
      _this.allowCommit = false
    }
  } else {
    _this.getPlaceholder(row)
    this.$set(row, 'isEdit', true)
    if (row.targetValue !== '' || row.targetValue != null) {
      _this.newParam = row.targetValue
    }
  }
}

export function getPlaceholder(row) {
  const _this = this
  if (row.paramType === 'INTEGER') {
    _this.placeholder = '[' + row.min + '-' + row.max + ']'
  } else if (row.paramType === 'ENUM') {
    _this.placeholder = row.enumValue
  } else {
    _this.placeholder = '[' + row.min + 'MB-' + row.max + 'MB]'
  }
}

export function modifyParams() {
  const _this = this
  // console.log(_this.allowCommit)
  if (_this.allowCommit) {
    // for (let i = 0; i < _this.parameterList.length; i++) {
    //   if (_this.parameterList[i].targetValue) {
    //     _this.updateParams.push({ 'paramName': _this.parameterList[i].name, 'targetValue': _this.parameterList[i].targetValue })
    //   }
    // }
    _this.parameterList.forEach((item) => {
      if (item.targetValue) {
        _this.updateParams.push({ 'paramName': item.name, 'targetValue': item.targetValue })
      }
    })
    const params = _this.updateParams
    // console.log(params)
    this.axios.put('/instances/' + _this.instanceId + '/parameters',
      { 'description': '', 'params': params },
      { headers: { 'Content-Type': 'application/json; charset=UTF-8' }}
    ).then(res => {
      if (res.status === 200) {
        _this.$message.success('下发指令成功，正在修改中...')
        setTimeout(() => { _this.$parent.getTableList() }, 300)
        _this.modifyParamsVisible = false
      } else {
        _this.$message.error(res.data.message + '!')
        return false
      }
    }).catch((error) => {
      this.$message.error(error)
    })
  } else {
    this.$message.error('请输入信息并且保存！')
    return false
  }
}
export function getParamHistory() {
  const _this = this
  this.axios.get('/instances/' + _this.instanceId + '/parameters/history/1/1000', {})
    .then((response) => {
      _this.listLoading = false
      _this.historyList = response.data.data
      console.log(_this.historyList)
    }).catch((error) => {
      this.$message.error(error)
    })
  // console.log(_this.historyList)
}
export function getParamLists(row) {
  this.modifyParamsVisible = true
  const instanceId = row.id
  const instanceName = row.name
  const clusterName = row.clusterName
  const namespace = row.namespace
  const _this = this
  this.axios.get('/instances/' + instanceId + '/parameters', {})
    .then((response) => {
      _this.listLoading = false
      _this.parameterList = response.data
      _this.instanceId = instanceId
      _this.instanceName = instanceName
      _this.clusterName = clusterName
      _this.namespace = namespace
    })
    .catch((error) => {
      this.$message.error(error)
    })
}

export function resetInput() {
  const _this = this
  _this.parameterList = []
  _this.allowCommit = false
  _this.$emit('update:visible', false)
  _this.$emit('update:instanceId', '')
  _this.$emit('update:instanceName', '')
  _this.$emit('update:clusterName', '')
  _this.$emit('update:namespace', '')
}
