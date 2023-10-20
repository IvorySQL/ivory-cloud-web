<template>
  <div class="login-container">
    <el-form
      ref="loginForm"
      :model="loginForm"
      :rules="loginRules"
      aria-autocomplete="on"
      label-position="left"
      class="login-form"
    >
      <img src="@/img/logo-hgcloud-blue.png" alt="logo" class="img-login">
      <p id="logo-title">瀚高云平台</p>
      <div class="title-container">
        <h3 class="title">Login</h3>
      </div>
      <el-form-item prop="username">
        <span class="svg-container">
          <svg-icon icon-class="user" />
        </span>
        <el-input
          ref="username"
          v-model.trim="loginForm.username"
          placeholder="Username"
          name="username"
          type="text"
          tabindex="1"
          auto-complete="on"
        />
      </el-form-item>
      <el-form-item prop="password">
        <span class="svg-container">
          <svg-icon icon-class="password" />
        </span>
        <el-input
          :key="passwordType"
          ref="password"
          v-model.trim="loginForm.password"
          :type="passwordType"
          placeholder="Password"
          name="password"
          tabindex="2"
          auto-complete="on"
        />
        <span class="show-pwd" @click="showPwd">
          <svg-icon
            :icon-class="passwordType === 'password' ? 'eye' : 'eye-open'"
          />
        </span>
      </el-form-item>

      <el-form-item prop="verifycode">
        <span class="svg-container">
          <svg-icon icon-class="form" />
        </span>
        <el-input
          v-model.trim="loginForm.verifycode"
          placeholder="Verification"
          class="identifyinput"
          @keyup.enter.native="handleLogin"
        />
      </el-form-item>
      <div class="identifybox">
        <div @click="refreshCode">
          <s-identify :identify-code="identifyCode" />
        </div>
        <span style="cursor: pointer; float: right" class="tips" @click="refreshCode">看不清，换一张</span>
      </div>

      <el-button
        :loading="loading"
        type="primary"
        @click.native.prevent="handleLogin"
      >Login
      </el-button>
      <div class="tips clearfix">
        <router-link
          v-if="showRegister"
          to="/register"
          style="float: left"
        >没有帐号？现在注册
        </router-link>
        <span
          style="cursor: pointer; float: right"
          @click="forgetPassword"
        >忘记密码？</span>
        <!-- <span style="margin-right: 20px">username: admin</span>
        <span> password: any</span> -->
      </div>
    </el-form>
  </div>
</template>
<script>
import checkPermission from '@/utils/permission' // 权限判断函数
import SIdentify from '@/components/Identify' // 登录验证码

export default {
  name: 'Login',
  components: {
    SIdentify
  },
  data() {
    const validatePassword = (loginRules, value, callback) => {
      if (value.length < 6) {
        callback(new Error('密码长度不能小于6位字符！'))
      } else {
        callback()
      }
    }
    /* 自定义验证码规则 */
    const validateVerifycode = (loginRules, value, callback) => {
      if (value === '') {
        callback(new Error('请输入验证码'))
      } else if (value !== this.identifyCode) {
        callback(new Error('验证码不正确!'))
      } else {
        callback()
      }
    }

    return {
      identifyCodes: '1234567890abcdefghijklmnopqrstuvwxyz',
      identifyCode: '',
      loginForm: {
        username: '',
        password: '',
        verification: ''
      },
      loginRules: {
        username: [
          {
            required: true,
            trigger: 'blur',
            message: '请输入正确的用户名！'
          }
        ],
        password: [
          {
            required: true,
            trigger: 'blur',
            validator: validatePassword
          }
        ],
        verifycode: [
          {
            required: true,
            trigger: 'blur',
            validator: validateVerifycode
          }
        ]
      },
      loading: false,
      passwordType: 'password',
      list: []
    }
  },
  computed: {
    showRegister() {
      // eslint-disable-next-line no-undef
      return globalShowRegister
    }
  },
  mounted() {
    this.identifyCode = ''
    this.makeCode(this.identifyCodes, 4)
    history.pushState(null, null, document.URL)
    if (window.history && window.history.pushState) {
      // eslint-disable-next-line no-undef
      $(window).on('popstate', function() {
        window.history.pushState('forward', null, '')
        window.history.forward(1)
      })
      window.history.pushState('forward', null, '') // 在IE中必须得有这两行
      window.history.forward(1)
    }
  },
  methods: {
    randomNum(min, max) {
      return Math.floor(Math.random() * (max - min) + min)
    },
    // 切换验证码
    refreshCode() {
      this.identifyCode = ''
      this.makeCode(this.identifyCodes, 4)
    },
    makeCode(o, l) {
      for (let i = 0; i < l; i++) {
        this.identifyCode += this.identifyCodes[
          this.randomNum(0, this.identifyCodes.length)]
      }
      // console.log(this.identifyCode)
      /* alert(this.identifyCode) */
    },
    showPwd() {
      if (this.passwordType === 'password') {
        this.passwordType = ''
      } else {
        this.passwordType = 'password'
      }
      this.$nextTick(() => {
        this.$refs.password.focus()
      })
    },
    handleLogin() {
      var _this = this
      this.$refs.loginForm.validate((valid) => {
        if (valid) {
          // eslint-disable-next-line no-unused-vars
          const password_md5 = this.$md5(this.loginForm.password + 'highgo')
          this.axios({
            url: '/login?username=' + this.loginForm.username + '&password=' + this.loginForm.password,
            method: 'post'
            // data: {
            //   userName: this.loginForm.username,
            //   password: this.loginForm.password,
            // },
          }).then((res) => {
            var status = res.data.code
            if (status === '200') {
              this.$message({
                message: res.data.message === '操作成功！' ? '登录成功！' : res.data.message,
                type: 'success'
              })

              var token = res.headers.authorization
              // token
              localStorage.XAUTHTOKEN = token

              const userId = res.data.data.userId
              const userName = this.loginForm.username
              localStorage.setItem(`userId`, userId)
              localStorage.setItem(`userName`, userName)

              var roles = res.data.data.roles
              localStorage.setItem('roles', JSON.stringify(roles))

              // this.$cookies.set('userId', userId, '60MIN')
              // 判断是否有订单
              _this.getTableList()
            } else {
              this.$message.error('登录失败，用户名或密码错误！')
              return false
            }
          }).catch((e) => {
            this.$message.error('登录失败，用户名或密码错误！')
          })
        } else {
          return false
        }
      })
    },
    checkPermission,
    getTableList() {
      var _this = this
      // 获取一下userId
      const userId = localStorage.getItem('userId')
      this.axios.get('/getAllDataBasesForUser', {
        params: {
          userId: userId
        }
      })
        .then((response) => {
          _this.list = response.data
          if (_this.list.length > 0) {
            // 有订单跳转订单页
            _this.$router.push({ path: '/Dashboard/index', query: { userId: userId }})
          } else {
            // admin 用户，直接跳转到 数据库管理页面
            if (checkPermission(['admin'])) {
              _this.$router.push({ path: '/Dashboard/index', query: { userId: userId }})
            } else {
              // 普通用于，如果没有数据库，则跳转到数据库订阅页面
              // _this.$router.push({ path: '/DBInstance/index', query: { userId: userId }})
              // _this.$router.push({ path: '/nativeCloud/DBInstance/index', query: { userId: userId }})
              _this.$router.push({ path: '/Dashboard/index', query: { userId: userId }})
            }
          }
        })
        .catch((error) => {
          this.$message.error(error)
        })
    },
    forgetPassword() {
      var _this = this
      if (_this.loginForm.username) {
        _this.$router.push({
          path: '/modifyPassword',
          query: { username: _this.loginForm.username }
        })
      } else {
        _this.$router.push({ path: '/modifyPassword' })
      }
    }
  }
}
</script>

<style lang="scss">
$bg: rgba(244, 244, 244, 1);
$light_gray: #fff;
$cursor: rgba(0, 0, 0, 0.8);

@supports (-webkit-mask: none) and (not (cater-color: $cursor)) {
  .login-container .el-input input {
    color: $cursor;
  }
}

/* reset element-ui css */
.login-container {
  .el-input {
    display: inline-block;
    height: 47px;
    width: 85%;

    input {
      background: transparent;
      border: 0px;
      -webkit-appearance: none;
      border-radius: 0px;
      padding: 12px 5px 12px 15px;
      color: rgba(0, 0, 0, 0.8);
      height: 47px;
      caret-color: $cursor;
      -webkit-transition: all 0.5s;
      transition: all 0.5s;

      &:-webkit-autofill {
        box-shadow: 0 0 0px 1000px $bg inset !important;
        -webkit-text-fill-color: $cursor !important;
      }
    }
  }

  input:hover {
    -webkit-transform: scale(1.03);
    transform: scale(1.03);
  }

  input:focus {
    font-size: 14px;
    font-family: GothamRnd Light;
    font-weight: 300;
    outline: #ed0652;

    /* color: #ED0652; */
  }

  .el-form-item {
    // background: rgba(0, 0, 0, 0.1);
    border-left: none !important;
    border-right: none !important;
    border-top: none !important;
    border-bottom: solid 1px;
    font-size: 14px;
    font-family: GothamRnd Light;
    font-weight: 300;
    color: rgba(102, 102, 102, 1);
    line-height: 28px;
    background: rgba(244, 244, 244, 1);
    opacity: 0.8;
  }

  .el-button {
    width: 100%;
    height: 40px;
    background: rgba(34, 65, 217, 1);
    font-size: 14px;
    font-family: Microsoft YaHei;
    font-weight: 400;
    padding: 2px;
    color: rgba(255, 255, 255, 1);
    line-height: 28px;
    border-radius: 20px;
    margin-top: 20px;
    margin-bottom: 30px;
  }
}
</style>

<style lang="scss" scoped>
$bg: rgba(244, 244, 244, 1);
$dark_gray: #889aa4;
$light_gray: #eee;

.login-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  min-width: 1000px;
  background-size: cover;
  background-position: center 0;
  min-height: 100%;
  background-image: url("../../../../src/img/bg-login2560x1440.jpg");
  overflow: hidden;

  .login-form {
    position: relative;
    width: 520px;
    max-width: 100%;
    padding: 40px 50px 50px 50px;
    margin: 0 auto;
    margin-top: 5%;
    background: rgba(244, 244, 244, 1);
    opacity: 0.7;
    overflow: hidden;
    border-radius: 20px;
  }

  .img-login {
    padding: 0;
    width: 105px;
    height: 12px;
  }

  #logo-title {
    width: 73px;
    height: 14px;
    font-size: 14px;
    font-family: Microsoft YaHei;
    font-weight: 300;
    color: rgba(102, 102, 102, 1);
    line-height: 28px;
    margin-bottom: 45px;
  }

  .svg-container {
    padding: 6px 5px 6px 15px;
    color: $dark_gray;
    vertical-align: middle;
    width: 30px;
    display: inline-block;
  }

  .title-container {
    position: relative;

    .title {
      font-size: 40px;
      font-family: GothamRnd Light;
      font-weight: 300;
      color: rgba(34, 65, 217, 1);
      line-height: 28px;
      margin: 0px auto 40px auto;
      text-align: center;
    }
  }

  .tips {
    font-size: 14px;
    font-family: Microsoft YaHei;
    font-weight: 300;
    color: rgba(102, 102, 102, 1);
    line-height: 28px;
  }

  .show-pwd {
    position: absolute;
    right: 10px;
    top: 7px;
    font-size: 16px;
    color: $dark_gray;
    cursor: pointer;
    user-select: none;
  }
  .identifybox {
    display: flex;
    justify-content: space-between;
    margin-top: 7px;
  }
}
</style>
