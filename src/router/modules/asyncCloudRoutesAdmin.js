import Layout from '@/layout'

export const asyncCloudRoutesAdmin = [

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
        name: 'KubernetesCluster',
        component: () => import('@/views/CloudNative/DataStorageServer'),
        meta: { title: 'K8s集群管理', icon: 'el-icon-toilet-paper' }
      }
    ]
  }
]
