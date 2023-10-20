<template>
  <div class="modify-container">
    <el-form
      ref="modifyForm"
      :model="modifyForm"
      :rules="modifyRules"
      class="modify-form"
      auto-complete="on"
      label-position="left"
    >

      <img src="src/img/logo-hgcloud-blue.png" alt="logo" class="img-login">
      <p id="logo-title">瀚高云平台</p>
      <div class="title-container">
        <h3 class="title">Modify</h3>
      </div>

      <el-form-item prop="username">
        <span class="svg-container">
          <svg-icon icon-class="user" />
        </span>
        <el-input
          ref="username"
          v-model="modifyForm.username"
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
          v-model="modifyForm.password"
          :type="passwordType"
          placeholder="New Password"
          name="password"
          tabindex="2"
          auto-complete="on"
        />
        <span class="show-pwd" @click="showPwd1">
          <svg-icon :icon-class="passwordType === 'password' ? 'eye' : 'eye-open'" />
        </span>
      </el-form-item>

      <el-form-item prop="confirmpass">
        <span class="svg-container">
          <svg-icon icon-class="password" />
        </span>
        <el-input
          :key="passwordType2"
          ref="confirmpass"
          v-model="modifyForm.confirmpass"
          :type="passwordType2"
          placeholder="Repeat New Password"
          name="confirmpass"
          tabindex="3"
          auto-complete="on"
        />
        <span class="show-pwd" @click="showPwd2">
          <svg-icon :icon-class="passwordType2 === 'password' ? 'eye' : 'eye-open'" />
        </span>
      </el-form-item>

      <el-form-item prop="email">
        <span class="svg-container">
          <i class="el-icon-message" />
        </span>
        <el-input
          ref="email"
          v-model="modifyForm.email"
          class="button-input"
          placeholder="E-Mail"
          name="email"
          type="text"
          tabindex="4"
          auto-complete="on"
          size="width: 10px"
          @keyup.enter.native="handlemodify"
        />
        <span class="button-container">
          <span
            v-if="!inProcess"
            style="cursor: pointer; float: right; size: 100px"
            @click="validateFields()"
          >
            获取验证码
          </span>
          <span
            v-if="inProcess"
            style="float: right; size: 100px"
          >
            {{ totalTime + 's后获取' }}
          </span>
        </span>
      </el-form-item>
      <el-form-item prop="verifycode">
        <span class="svg-container">
          <svg-icon icon-class="form" />
        </span>
        <el-input
          v-model="modifyForm.verifycode"
          placeholder="Verification"
          class="identifyinput"
          @keyup.enter.native="handlemodify"
        />
      </el-form-item>

      <el-button :loading="loading" type="primary" style="width:100%;margin-bottom:30px;" @click.native.prevent="handlemodify">Modify</el-button>

      <div class="tips">
        <router-link
          to="/UserLogin"
          style="margin-right: 180px"
        >返回登录</router-link>
        <!-- <span style="margin-right: 20px">username: admin</span>
        <span> password: any</span> -->
      </div>

    </el-form>
  </div>
</template>

<script>

export default {
  name: 'Modify',
  data() {
    const validatePassword = (modifyRules, value, callback) => {
      if (value.length < 6) {
        callback(new Error('密码长度不能小于6位！'))
      } else {
        if (this.modifyForm.confirmpass !== '') {
          this.$refs.modifyForm.validateField('confirmpass')
        }
        callback()
      }
    }
    const validateConfirmPass = (modifyRules, value, callback) => {
      if (value.length < 6) {
        callback(new Error('密码长度不能小于6位！'))
      }
      if (value !== this.modifyForm.password) {
        callback(new Error('密码与确认密码不一致！'))
      } else {
        callback()
      }
    }

    const validateEmail = (modifyRules, value, callback) => {
      if (value === '') {
        callback(new Error('请输入正确的邮箱！'))
      } else {
        if (value !== '') {
          const reg = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
          if (!reg.test(value)) {
            callback(new Error('请输入有效的邮箱！'))
          }
        }
        callback()
      }
    }

    const validateVerifycode = (modifyRules, value, callback) => {
      if (value === '') {
        callback(new Error('请输入验证码'))
      } else {
        callback()
      }
    }
    return {
      modifyForm: {
        username: '',
        password: '',
        confirmpass: '',
        email: '',
        verifycode: ''
      },
      modifyRules: {
        username: [{ required: true, trigger: 'blur', message: '长度在6到16个字符之间！' }],
        password: [{ required: true, trigger: 'blur', validator: validatePassword }],
        confirmpass: [{ required: true, trigger: 'blur', validator: validateConfirmPass },
          { min: 6, max: 16, message: '长度在6到16个字符之间！', trigger: blur }],
        email: [{ required: true, trigger: 'blur', validator: validateEmail }],
        verifycode: [{ required: true, trigger: 'blur', validator: validateVerifycode }]
      },
      loading: false,
      passwordType: 'password',
      passwordType2: 'password',
      inProcess: false,
      totalTime: 120
      // redirect: undefined
    }
  },
  mounted() {
    var username = this.$route.query.username
    this.modifyForm.username = username
  },
  methods: {
    showPwd1() {
      if (this.passwordType === 'password') {
        this.passwordType = ''
      } else {
        this.passwordType = 'password'
      }
      this.$nextTick(() => {
        this.$refs.password.focus()
      })
    },
    showPwd2() {
      if (this.passwordType2 === 'password') {
        this.passwordType2 = ''
      } else {
        this.passwordType2 = 'password'
      }
      this.$nextTick(() => {
        this.$refs.confirmpass.focus()
      })
    },
    /**
     * 校验多个字段
     */
    validateFields() {
      const _this = this
      // 需要校验的字段
      const fieldsToValidate = ['username', 'email']
      // 将回调转换为Promise
      Promise.all(
        fieldsToValidate.map((field) => {
          return new Promise((resolve, reject) => {
            this.$refs.modifyForm.validateField(field, (errorMessage) => {
              resolve(errorMessage)
            })
          })
        })
      ).then((errorMessages) => {
        // console.info(errorMessages);
        //  ['请输入姓名', '请输入年龄']
        // errorMessages 里是各个字段的验证错误信息, 如果数组里全为空串则所有验证通过
        // 判断errorMessages 里是否全是空串
        const valid = errorMessages.every((errorMessage) => {
          return errorMessage === ''
        })
        // console.log(valid); // true/false
        if (valid) {
          _this.getEmailVerification()
          _this.inProcess = true
          const interval = window.setInterval(function() {
            if ((_this.totalTime--) <= 0) {
              _this.totalTime = 120
              _this.inProcess = false
              window.clearInterval(interval)
            }
            // console.log("倒计时"+_this.totalTime+"s！")
          }, 1000)
        }
      })
    },
    getEmailVerification() {
      const _this = this
      // 验证邮箱是否跟注册时的相同
      this.axios.post('/emailVerificationCode', {
        userEmail: _this.modifyForm.email,
        userName: _this.modifyForm.username
      }).then(res => {
        if (res.status === 200) {
          if (res.data.success) {
            _this.$message.success('验证码已发送，请前往邮箱查看！')
            return true
          } else {
            _this.$message.error(res.data.message)
            return false
          }
        } else {
          _this.$message.error(res.data.message)
          return false
        }
      }).catch(function(error) {
        console.log(error)
        return false
      })
    },
    verifyRegistrationEmail() {
      const _this = this
      this.axios.post('/verifyRegistrationEmail', {
        userEmail: _this.modifyForm.email,
        userName: _this.modifyForm.username
      }).then(res => {
        if (res.status === 200) {
          if (res.data.success) {
            return true
          } else {
            _this.$message.error(res.data.message)
            return false
          }
        } else {
          _this.$message.error(res.data.message)
          return false
        }
      }).catch(function(error) {
        console.log(error)
        return false
      })
    },
    handlemodify() {
      const _this = this
      if (_this.modifyForm.username === 'admin') {
        _this.$message.warning('admin用户的密码不能修改，请联系维护人员！')
        // _this.$router.push("/UserLogin");
        return
      }
      this.$refs.modifyForm.validate((valid) => {
        if (valid) {
          this.axios.post('/updateUserInfo', {
            userName: _this.modifyForm.username,
            password: _this.modifyForm.password,
            email: _this.modifyForm.email,
            verificationCode: _this.modifyForm.verifycode
          }).then(res => {
            if (res.status === 200) {
              if (res.data.success) {
                _this.$message.success('修改成功，即将跳转至登录页面')
                setTimeout(() => {
                  _this.$router.push('/UserLogin')
                }, 1000)
                return true
              } else {
                _this.$message.error(res.data.message)
                return false
              }
            } else {
              _this.$message.error(res.data.message)
              return false
            }
          }).catch(function(error) {
            console.log(error)
          })
        } else {
          console.log('error submit!!')
          return false
        }
      })
    }
  }
}
</script>

<style lang="scss">
  $bg:  rgba(244, 244, 244, 1);
  $light_gray: #fff;
  $cursor: rgba(0, 0, 0, 0.8);

  @supports (-webkit-mask: none) and (not (cater-color: $cursor)) {
    .modify-container .el-input input {
      color: $cursor;
    }
  }

  /* reset element-ui css */
  .modify-container {
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
      background: rgba(0, 0, 0, 0.1);
      border-left: none !important;
      border-right: none !important;
      border-top: none !important;
      border-bottom: solid 1px;
      font-size: 14px;
      font-family: GothamRnd Light;
      font-weight: 300;
      color: rgba(102, 102, 102, 1);
      line-height: 28px;
      background-color: rgba(244, 244, 244, 1);
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
  $bg: #2d3a4b;
  $dark_gray: #889aa4;
  $light_gray: #eee;

  .modify-container {
    min-height: 100%;
    width: 100%;
    background-image: url("../../../../src/img/bg-login2560x1440.jpg");
    overflow: hidden;

    .modify-form {
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
    .button-input{
      width: 70%;
    }
    .button-container {
      padding: 6px 5px 6px 15px;
      color: $dark_gray;
      vertical-align: middle;
      width: 40px;
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
  }
  </style>
