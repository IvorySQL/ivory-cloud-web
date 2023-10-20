<template>
  <div class="navbar">
    <hamburger :is-active="sidebar.opened" class="hamburger-container" @toggleClick="toggleSideBar" />
    <breadcrumb class="breadcrumb-container" />
    <div class="right-menu">
      <el-dropdown class="avatar-container" trigger="click">
        <div class="avatar-wrapper" style="color: #fff">
          <img
            src="https://console1.cloud.inspur.com/vpc/assets/images/head.png"
            class="user-avatar"
          >
          <i class="el-icon-caret-bottom" />
        </div>
        <el-dropdown-menu slot="dropdown" class="user-dropdown">
          <router-link to="/Dashboard/index">
            <el-dropdown-item>
              {{ userName }}
            </el-dropdown-item>
          </router-link>
          <el-dropdown-item divided @click.native="logout">
            <span style="display:block;">Log Out</span>
          </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>
    <div
      class="right-menu"
      style="margin-right: 20px;font-weight: 500;font-size: 14px;line-height: 50px;color: #ffffff;"
    >
      <!-- <span style="margin-right: 20px;cursor:pointer" @click="Usage"><i class="el-icon-document"
                                                                           style="margin-right: 3px;"></i>使用手册</span> -->
      <!--      <span style="margin-right: 20px;cursor:pointer">-->
      <!--        &lt;!&ndash; <a href="../../../Usage.html" target="_blank"> &ndash;&gt;-->
      <!--        <a :href="globalDocUrl" target="_blank">-->
      <!--          <i class="el-icon-document" style="margin-right: 1px"></i>-->
      <!--          使用手册-->
      <!--        </a>-->
      <!--      </span>-->
      <!--      <span style="margin-right: 20px;cursor:pointer" @click="FeedBack"><i class="el-icon-edit-outline"-->
      <!--                                                                           style="margin-right: 3px;"></i>意见反馈</span>-->
      <span>
        <a href="https://www.highgo.com/connection.html" target="_blank">
          <i class="el-icon-office-building" style="margin-right: 1px" />
          关于我们
        </a>
      </span>
    </div>
  </div>
</template>

<script>
import store from '@/store'
import headPic from '../../img/headPic.png'
import { mapGetters } from 'vuex'
import Breadcrumb from '@/components/Breadcrumb'
import Hamburger from '@/components/Hamburger'

export default {
  components: {
    Breadcrumb,
    Hamburger
  },
  data() {
    return {
      headPic: headPic,
      userName: ''
    }
  },
  computed: {
    ...mapGetters([
      'sidebar',
      'avatar'
    ])
  },
  mounted() {
    this.getUserName()
    // this.getTableList();
  },
  methods: {
    getUserName() {
      console.log('get username from store ===========', store.getters.name)
      this.userName = store.getters.name
    },
    getTableList() {
      const _this = this
      var userId = localStorage.getItem('userId')
      if (!userId) {
        userId = localStorage.getItem('userId')
      }
      this.axios.get('/getComments', {
        params: {
          userId: userId
        }
      }).then(res => {
        if (res.data) {
          var list = res.data
          this.userName = list[0].userName
        }
      }).catch(function(error) {
        _this.$message.error(error)
      })
    },
    toggleSideBar() {
      this.$store.dispatch('app/toggleSideBar')
    },
    async logout() {
      this.axios({
        url: '/logout',
        method: 'post',
        contenttype: 'application/x-www-form-urlencoded'
      }).then((res) => {
        localStorage.clear()
        this.$cookies.remove('userId')

        // 清除login的信息，并且重置路由
        this.$store.dispatch('user/logout')
        // 清除role
        // this.$store.dispatch('user/removeRoles')

        this.$router.push({ path: '/login' })
        //    this.$router.push("/login");
      }).catch((error) => {
        this.$message.error(error)
      })

      // localStorage.clear();
      // this.$cookies.remove("userId");
      // this.$router.push({path: '/login'})
    },
    FeedBack() {
      this.$router.push({ path: '/FeedBack/index' })
    },
    Usage() {
      this.$router.push({ path: '/Usage/index' })
    }
  }
}
</script>

<style lang="scss" scoped>
  .navbar {
    height: 50px;
    overflow: hidden;
    position: relative;
    background: #001529;
    box-shadow: 0 1px 4px rgba(0, 21, 41, .08);

    .hamburger-container {
      line-height: 51px;
      height: 100%;
      float: left;
      cursor: pointer;
      transition: background .3s;
      -webkit-tap-highlight-color: transparent;

      &:hover {
        background: rgba(0, 0, 0, .025)
      }
    }

    .breadcrumb-container {
      float: left;
    }

    .right-menu {
      float: right;
      height: 100%;
      line-height: 50px;

      &:focus {
        outline: none;
      }

      .right-menu-item {
        display: inline-block;
        padding: 0 8px;
        height: 100%;
        font-size: 18px;
        color: #5a5e66;
        vertical-align: text-bottom;

        &.hover-effect {
          cursor: pointer;
          transition: background .3s;

          &:hover {
            background: rgba(0, 0, 0, .025)
          }
        }
      }

      .avatar-container {
        margin-right: 30px;

        .avatar-wrapper {
          margin-top: 5px;
          position: relative;

          .user-avatar {
            cursor: pointer;
            width: 40px;
            height: 40px;
            border-radius: 10px;
          }

          .el-icon-caret-bottom {
            cursor: pointer;
            position: absolute;
            right: -20px;
            top: 25px;
            font-size: 12px;
          }
        }
      }
    }
  }
</style>
