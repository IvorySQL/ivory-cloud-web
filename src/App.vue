<template>
  <div id="app">
    <router-view />
  </div>
</template>
<style>
  .el-table--border th.gutter:last-of-type {
    display: block!important;
    width: 17px!important;
  }
  body .el-table th.gutter {
    display: table-cell !important;
  }

  body .el-table colgroup.gutter {
    display: table-cell !important;
  }
  .el-table th.gutter{
    display: table-cell!important;
  }
</style>
<script>
export default {
  name: 'App'
}
</script>
