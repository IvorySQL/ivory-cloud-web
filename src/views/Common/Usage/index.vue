<template>
  <div class="app-container">
    <a href="../../../瀚高企业版数据库系统V7.0.1-安装手册(x86_64-centos7平台).pdf" target="_blank">
      瀚高企业版数据库系统V7.0.1-安装手册(x86_64-centos7平台)</a>
    <el-row style="padding-bottom: 20px;float: right;">
      <el-button type="" @click="onCancel">返回</el-button>
    </el-row>
  </div>
</template>

<script>
export default {
  data() {
    return {

    }
  },
  mounted() {

  },
  methods: {
    onCancel() {
      const _this = this
      _this.$router.go(-1)
    }
  }
}
</script>
