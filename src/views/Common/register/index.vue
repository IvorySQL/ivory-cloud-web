<template>
  <div class="register-container">
    <el-form
      ref="registerForm"
      :model="registerForm"
      :rules="registerRules"
      aria-autocomplete="on"
      label-position="left"
      class="register-form"
    >
      <img src="@/img/logo-hgcloud-blue.png" alt="logo" class="img-login">
      <p id="logo-title">瀚高云平台</p>
      <div class="title-container">
        <h3 class="title">Register</h3>
      </div>
      <el-form-item prop="username">
        <span class="svg-container">
          <svg-icon icon-class="user" />
        </span>
        <el-input
          ref="username"
          v-model.trim="registerForm.username"
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
          v-model.trim="registerForm.password"
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
      <el-form-item prop="confirmpass">
        <span class="svg-container">
          <svg-icon icon-class="password" />
        </span>
        <el-input
          :key="passwordType2"
          ref="password"
          v-model.trim="registerForm.confirmpass"
          :type="passwordType2"
          placeholder="ConfirmPassword"
          name="confirmpass"
          tabindex="3"
          auto-complete="on"
        />
        <span class="show-pwd" @click="showPwd2">
          <svg-icon
            :icon-class="passwordType2 === 'password' ? 'eye' : 'eye-open'"
          />
        </span>
      </el-form-item>
      <el-form-item prop="email">
        <span class="svg-container">
          <i class="el-icon-message" />
        </span>
        <el-input
          ref="email"
          v-model.trim="registerForm.email"
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
          v-model.trim="registerForm.verifycode"
          placeholder="Verification"
          class="identifyinput"
          @keyup.enter.native="handlemodify"
        />
      </el-form-item>
      <el-form-item prop="cellphone">
        <span class="svg-container">
          <i class="el-icon-phone" />
        </span>
        <el-input
          ref="cellphone"
          v-model.trim="registerForm.cellphone"
          placeholder="CellPhone"
          name="cellphone"
          type="text"
          tabindex="4"
          auto-complete="on"
          @keyup.enter.native="handleRegister"
        />
      </el-form-item>
      <el-form-item prop="cellphone" style="padding: 0 15px;">
        <el-row>
          <el-col :span="12">
            <div class="grid-content bg-purple">
              <el-radio v-model="registerForm.userType" label="2">正式用户</el-radio>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="grid-content bg-purple-light">
              <el-radio v-model="registerForm.userType" label="1">体验用户</el-radio>
            </div>
          </el-col>
        </el-row>
      </el-form-item>
      <el-button
        type="primary"
        style="width: 100%; margin-bottom: 30px"
        @click.native.prevent="handleRegister"
      >Register
      </el-button>
      <div class="tips">
        <router-link
          to="/UserLogin"
          style="margin-right: 180px"
        >已有账号？返回登录
        </router-link>
      </div>
    </el-form>
  </div>
</template>
<script>

import axios from 'axios'

export default {
  name: 'Register',

  data() {
    const validatePassword = (registerRules, value, callback) => {
      if (value === '') {
        callback(new Error('请输入密码！'))
      } else {
        if (this.registerForm.confirmpass !== '') {
          this.$refs.registerForm.validateField('confirmpass')
        }
        callback()
      }
    }
    const validateConfirmPass = (registerRules, value, callback) => {
      if (value === '') {
        callback(new Error('请再次输入密码！'))
      } else if (value !== this.registerForm.password) {
        callback(new Error('两次输入的密码不一致！'))
      } else {
        callback()
      }
    }
    const validateEmail = (registerRules, value, callback) => {
      if (value === '') {
        callback(new Error('请正确填写邮箱！'))
      } else {
        if (value !== '') {
          // var reg = /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/
          // var reg = /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/
          const reg = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
          if (!reg.test(value)) {
            callback(new Error('请输入有效的邮箱！'))
          }
        }
        callback()
      }
    }
    const validatePhone = (registerRules, value, callback) => {
      if (value.length !== 11 || value.length !== 7) {
        callback(new Error('请输入正确的电话号码！'))
      } else {
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
      registerForm: {
        username: '',
        password: '',
        confirmpass: '',
        email: '',
        cellphone: '',
        userType: '2',
        verifycode: ''
      },
      registerRules: {
        username: [
          {
            required: true,
            message: '请输入用户名！',
            trigger: 'blur'
            // validator: validateUsername,
          }
        ],
        password: [
          {
            required: true,
            trigger: 'blur',
            validator: validatePassword
          },
          {
            min: 6,
            max: 16,
            trigger: 'blur'
          }
        ],
        confirmpass: [
          {
            required: true,
            validator: validateConfirmPass,
            trigger: 'blur'
          },
          {
            min: 6,
            max: 16,
            trigger: 'blur'
          }
        ],
        email: [
          {
            required: true,
            trigger: 'blur',
            validator: validateEmail
          }
        ],
        verifycode: [{ required: true, trigger: 'blur', validator: validateVerifycode }]
      },
      cellphone: [
        { required: true, trigger: 'blur', validator: validatePhone }
      ],
      // loading: false,
      passwordType: 'password',
      passwordType2: 'password',
      inProcess: false,
      totalTime: 120
    }
  },
  methods: {
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
            this.$refs.registerForm.validateField(field, (errorMessage) => {
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
          // 判断邮箱是否已经使用

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
      this.axios.post('/emailVerificationCodeForRegister', {
        userEmail: _this.registerForm.email,
        userName: _this.registerForm.username
      }).then(res => {
        if (res.status === 200) {
          if (res.data.success) {
            _this.$message.success('验证码已发送，请前往邮箱查看！')
            return true
          } else {
            _this.inProcess = false
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
      this.axios.post('/emailVerificationCodeForRegister', {
        userEmail: _this.registerForm.email,
        userName: _this.registerForm.username
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
    handleRegister() {
      this.$refs.registerForm.validate((valid) => {
        if (valid) {
          axios({
            url: '/userRegister',
            method: 'post',
            data: {
              userName: this.registerForm.username,
              password: this.registerForm.password,
              email: this.registerForm.email,
              cellPhone: this.registerForm.cellphone,
              userType: this.registerForm.userType,
              verificationCode: this.registerForm.verifycode
            }
          }).then((res) => {
            var status = res.data.resultcode
            if (status === 1) {
              this.$message.success(res.data.message)
              setTimeout(() => {
                this.$router.push('/login')
              }, 1000)
            } else {
              this.$message.error(res.data.message)
            }
          })
        } else {
          this.$message.error('信息填写错误，请检查！')
          return false
        }
      })
    }
  }
}
</script>

<style lang="scss">
  $bg: rgba(244, 244, 244, 1);
  $light_gray: #fff;
  $cursor: rgba(0, 0, 0, 0.8);

  @supports (-webkit-mask: none) and (not (cater-color: $cursor)) {
    .register-container .el-input input {
      color: $cursor;
    }
  }

  /* reset element-ui css */
  .register-container {
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
      margin-top: 20px;
      height: 40px;
      background: #ed0652;
      font-size: 14px;
      font-family: Microsoft YaHei;
      font-weight: 400;
      padding: 2px;
      color: rgba(255, 255, 255, 1);
      line-height: 28px;
      border-radius: 20px;
    }
  }
</style>

<style lang="scss" scoped>
  $bg: rgba(244, 244, 244, 1);
  $dark_gray: #889aa4;
  $light_gray: #eee;

  .register-container {
    /*position: fixed;*/
    /*top: 0;*/
    /*left: 0;*/
    width: 100%;
    min-width: 1000px;
    background-size: cover;
    background-position: center 0;
    min-height: 100%;
    background-image: url("../../../../src/img/bg-login2560x1440.jpg");
    overflow: hidden;

    .register-form {
      position: relative;
      width: 520px;
      max-width: 100%;
      padding: 40px 35px 30px 35px;
      margin: 0 auto;
      margin-top: 5%;
      margin-bottom: 5%;
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
        font-family: Gotham Rounded;
        font-weight: 300;
        font-size: 40px;
        color: #ed0652;
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
