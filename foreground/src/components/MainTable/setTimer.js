export function setTimer() {
  var _this = this
  _this.clock = window.setInterval(() => {
    _this.getTableList2()
  }, 30000)
}
export function getTableList2() {
  var _this = this
  let userId = localStorage.getItem('userId')
  if (!userId) {
    userId = localStorage.getItem('userId')
  }
  this.axios.get('/instances/list/' + userId, {})
    .then((response) => {
      var list = _this.AddChecked(response.data)
      // for (let i = 0; i < list.length; i++) {
      //   if (list[i].children != null) {
      //     list[i].children.map(item => {
      //       item.checked = false
      //     })
      //   }
      // }
      list.forEach((element) => {
        if (element.children != null) {
          element.children.map(item => {
            item.checked = false
          })
        }
      })
      _this.flag = true
      _this.list = list
    })
    .catch((error) => {
      this.$message.error(error)
    })
}
export function getTableList() {
  var _this = this
  _this.listLoading = true
  let userId = localStorage.getItem('userId')
  if (!userId) {
    userId = localStorage.getItem('userId')
  }
  this.axios.get('/instances/list/' + userId, {})
    .then((response) => {
      // _this.listLoading = false;
      var list = _this.AddChecked(response.data)
      // for (let i = 0; i < list.length; i++) {
      //   if (list[i].children != null) {
      //     list[i].children.map(item => {
      //       item.checked = false
      //     })
      //   }
      // }
      list.forEach((element) => {
        if (element.children != null) {
          element.children.map(item => {
            item.checked = false
          })
        }
      })
      _this.flag = true
      _this.list = list
    })
    .catch((error) => {
      this.$message.error(error)
    })
}
export function AddChecked(arr) {
  arr.map(item => {
    if (item) {
      item.checked = false
    }
  })
  return arr
}
