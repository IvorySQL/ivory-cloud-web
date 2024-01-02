/**
 * In MainTable
 * @param command
 */
export default function handleCommand(command) {
  const _this = this
  const instanceId = command.row.id
  if (command.command === 'login') {
    this.axios.get('/instances/' + instanceId + '/hgadmin', {}).then(res => {
      _this.loading = false
      if (res.status === 200) {
        window.open('http://' + res.data.message, '_blank')
      } else {
        _this.$message.error(res.data.message)
      }
    }).catch(function(error) {
      _this.$message.error(error)
    })
  }
  if (command.command === 'restart') {
    _this.$parent.getConfirmInfo(command.row, '重启')
  }
  // 备份
  if (command.command === 'backup') {
    _this.$parent.getBackupInfo(command.row)
  }
  // 恢复
  if (command.command === 'recovery') {
    _this.$parent.getBackupLists(command.row)
  }
  // 监控
  if (command.command === 'monitor') {
    this.$router.push({
      path: '/nativeCloud/Monitor/index'
    })
  }
  // 扩容
  if (command.command === 'expansion') {
    _this.$parent.getStorageInfo(command.row)
  }
  // 规格变更
  if (command.command === 'change') {
    _this.$parent.getSpecInfos(command.row)
  }
  // 参数修改
  if (command.command === 'params') {
    _this.$parent.getParamLists(command.row)
  }
  // 删除实例
  if (command.command === 'delete') {
    _this.$parent.getConfirmInfo(command.row, '删除')
  }
}

export function composeValue(name, row) {
  return {
    'row': row,
    'command': name
  }
}

export function handleJump(index) {
  var _this = this
  _this.$router.push({
    path: '/nativeCloud/DBDetail/index',
    query: {
      instanceId: index.id,
      flag: false
    }
  })
}

export function getConfirmInfo(row, option) {
  const _this = this
  const instanceId = row.id
  const instanceName = row.name
  const clusterName = row.clusterName
  const namespace = row.namespace
  _this.confirmVisible = true
  _this.instanceId = instanceId
  _this.instanceName = instanceName
  _this.clusterName = clusterName
  _this.namespace = namespace
  _this.option = option
}

export function resetConfirm() {
  const _this = this
  _this.$emit('update:visible', false)
  _this.$emit('update:instanceId', '')
  _this.$emit('update:instanceName', '')
  _this.$emit('update:clusterName', '')
  _this.$emit('update:namespace', '')
  _this.isButtonLoading = false
}

export function CallParents(row, roleFlag) {
  const _this = this
  // console.log(row);
  // console.log(roleFlag);
  if (roleFlag === 'Backup') {
    _this.$parent.getBackupInfo(row)
  } else if (roleFlag === 'Restore') {
    _this.$parent.getBackupLists(row)
  } else if (roleFlag === 'Expansion') {
    _this.$parent.getStorageInfo(row)
  } else if (roleFlag === 'SpecificationChange') {
    _this.$parent.getSpecInfos(row)
  } else if (roleFlag === 'ParameterModuleManage') {
    _this.$parent.getParamLists(row)
  } else {
    return false
  }
}
