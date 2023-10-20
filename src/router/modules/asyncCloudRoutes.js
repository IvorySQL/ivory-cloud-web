import Layout from '@/layout'

/**
 * asyncRoutes
 * the routes that need to be dynamically loaded based on user roles
 */
export const asyncCloudRoutes = [
// 云原生数据库
  {
    path: '/Dashboard',
    component: Layout,
    children: [{
      path: 'index',
      name: 'Dashboard',
      component: () => import('@/views/CloudNative/Dashboard'),
      meta: { title: '首页', icon: 'dashboard' }
    }]
  },
  {
    path: '/nativeCloud/DataStorageServer',
    component: Layout,
    hidden: disableNative,
    children: [
      {
        path: 'index',
        name: 'DataStorageServer',
        component: () => import('@/views/CloudNative/DataStorageServer'),
        meta: { title: 'K8s集群管理', icon: 'el-icon-toilet-paper' }
      }
    ]
  },
  {
    path: '/nativeCloud/DBManage',
    component: Layout,
    hidden: disableNative,
    children: [{
      path: 'index',
      name: 'DBManage',
      component: () => import('@/views/CloudNative/DBManage'),
      meta: { title: '数据库管理', icon: 'el-icon-s-help', roles: ['routine'] }
    }]
  },
  {
    path: '/nativeCloud/DBInstance',
    component: Layout,
    hidden: disableNative,
    children: [{
      path: 'index',
      name: 'DBInstance',
      component: () => import('@/views/CloudNative/DBInstance'),
      meta: { title: '数据库订阅', icon: 'el-icon-s-finance', roles: ['routine'] }
    }]
  },

  {
    path: '/nativeCloud/ConfirmOrder',
    component: Layout,
    hidden: true,
    children: [{
      path: 'index',
      name: 'ConfirmOrder',
      component: () => import('@/views/CloudNative/ConfirmOrder'),
      meta: { title: '确认信息', icon: 'el-icon-s-help', roles: ['routine'] }
    }]
  },
  {
    path: '/nativeCloud/DataDbIntance',
    hidden: true,
    component: Layout,
    children: [
      {
        path: 'index',
        name: 'DataDbIntance',
        component: () => import('@/views/CloudNative/DataDbIntance'),
        meta: { title: '数据库实例', icon: 'form', roles: ['routine'] }
      }
    ]
  },
  {
    path: '/nativeCloud/DBDetail',
    hidden: true,
    component: Layout,
    children: [
      {
        path: 'index',
        name: 'DBDetail',
        component: () => import('@/views/CloudNative/DBDetail'),
        meta: { title: '详细信息', icon: 'form', roles: ['routine'] }
      }
    ]
  },
  {
    path: '/nativeCloud/Backup',
    component: Layout,
    hidden: disableNative,
    children: [
      {
        path: 'index',
        name: 'Backup',
        component: () => import('@/views/CloudNative/Backup'),
        meta: { title: '数据库备份', icon: 'el-icon-document-copy', roles: ['routine'] }
      }
    ]
  },
  {
    path: '/nativeCloud/Restore',
    component: Layout,
    hidden: disableNative,
    children: [
      {
        path: 'index',
        name: 'Restore',
        component: () => import('@/views/CloudNative/Restore'),
        meta: { title: '数据库恢复', icon: 'el-icon-document-checked', roles: ['routine'] }
      }
    ]
  },
  {
    path: '/nativeCloud/Monitor',
    component: Layout,
    hidden: disableNative,
    children: [
      {
        path: 'index',
        name: 'Monitor',
        component: () => import('@/views/CloudNative/Monitor'),
        meta: { title: '监控工具', icon: 'el-icon-s-data', roles: ['routine'] }
      }
    ]
  },
  // 磁盘扩容
  {
    path: '/nativeCloud/DBExpansion',
    component: Layout,
    hidden: disableNative,
    children: [
      {
        path: 'index',
        name: 'DBExpansion',
        component: () => import('@/views/CloudNative/DBExpansion'),
        meta: { title: '磁盘扩容', icon: 'form', roles: ['routine'] }
      },
      {
        path: 'details',
        hidden: true,
        name: 'DBExpansionDetails',
        component: () => import('@/views/CloudNative/DBExpansion/details'),
        meta: { title: '磁盘扩容', icon: 'form', roles: ['routine'] }
      }
    ]
  },
  {
    path: '/nativeCloud/DBSpecificationChange',
    component: Layout,
    hidden: disableNative,
    children: [
      {
        path: 'index',
        name: 'DBSpecificationChange',
        component: () => import('@/views/CloudNative/DBSpecificationChange'),
        meta: { title: '规格变更', icon: 'link', roles: ['routine'] }
      },
      {
        path: 'details',
        hidden: true,
        name: 'DBSpecificationChangeDetails',
        component: () => import('@/views/CloudNative/DBSpecificationChange/details'),
        meta: { title: '规格变更', icon: 'form', roles: ['routine'] }
      }
    ]
  },
  {
    path: '/nativeCloud/ParameterModuleManage',
    component: Layout,
    hidden: disableNative,
    children: [
      {
        path: 'index',
        name: 'ParameterModuleManage',
        component: () => import('@/views/CloudNative/ParameterModuleManage'),
        meta: { title: '参数管理', icon: 'el-icon-folder', roles: ['routine'] }
      }
    ]
  },

  {
    path: '/nativeCloud/ExpansionAndContraction',
    component: Layout,
    hidden: disableNative,
    children: [
      {
        path: 'index',
        name: 'ExpansionAndContraction',
        component: () => import('@/views/CloudNative/ExpansionAndContraction'),
        meta: { title: '自动扩缩容', icon: 'el-icon-folder', roles: ['routine'] }
      },
      {
        path: 'detail',
        name: 'ExpansionAndContraction',
        hidden: true,
        component: () => import('@/views/CloudNative/ExpansionAndContraction/detail'),
        meta: { title: '自动扩缩容', icon: 'el-icon-folder', roles: ['routine'] }
      }
    ]
  },

  // 404 page must be placed at the end !!!
  { path: '*', redirect: '/404', hidden: true }
// ]},
]
