import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: '/authn',
    name: 'Auth',
    redirect: '/authn/login',
    component: () => import('@/views/Auth.vue'),
    children: [
      {
        path: 'login',
        name: 'Login',
        meta: {
          title: 'Login | Speckle'
        },
        component: () => import('@/views/auth/Login.vue')
      },
      {
        path: 'register',
        name: 'Register',
        meta: {
          title: 'Register | Speckle'
        },
        component: () => import('@/views/auth/Registration.vue')
      },
      {
        path: 'resetpassword',
        name: 'Reset Password',
        meta: {
          title: 'Register | Speckle'
        },
        component: () => import('@/views/auth/ResetPasswordRequest.vue')
      },
      {
        path: 'resetpassword/finalize',
        name: 'Reset Password Finalization',
        meta: {
          title: 'Register | Speckle'
        },
        component: () => import('@/views/auth/ResetPasswordFinalization.vue')
      },
      {
        path: 'verify/:appId/:challenge',
        name: 'Authorize App',
        meta: {
          title: 'Authorizing App | Speckle'
        },
        component: () => import('@/views/auth/AuthorizeApp.vue')
      }
    ]
  },
  {
    path: '/',
    meta: {
      title: 'Home | Speckle'
    },
    component: () => import('@/cleanup/Main.vue'),
    children: [
      {
        path: '',
        name: 'home',
        meta: {
          title: 'Home | Speckle',
          showBottomNavActions: true
        },
        component: () => import('@/cleanup/pages/Feed.vue')
      },
      {
        path: 'streams',
        name: 'streams',
        meta: {
          title: 'Streams | Speckle',
          showBottomNavActions: true
        },
        component: () => import('@/cleanup/pages/Streams.vue')
      },
      {
        path: 'streams/:streamId',
        meta: {
          title: 'Stream | Speckle'
        },
        component: () => import('@/cleanup/pages/stream/Stream.vue'),
        children: [
          {
            path: '',
            name: 'stream',
            meta: {
              title: 'Stream | Speckle'
            },
            component: () => import('@/cleanup/pages/stream/StreamHome.vue')
          },
          {
            path: 'branches/',
            name: 'branches',
            redirect: 'branches/main'
          },
          {
            path: 'branches/:branchName*',
            name: 'branch',
            meta: {
              title: 'Branch | Speckle'
            },
            component: () => import('@/cleanup/pages/stream/Branch.vue'),
            beforeEnter: (to, from, next) => {
              if (to.params.branchName.toLowerCase() !== to.params.branchName)
                return next(
                  `/streams/${to.params.streamId}/branches/${to.params.branchName.toLowerCase()}`
                )
              else next()
            }
          },
          {
            path: 'commits/:commitId',
            name: 'commit',
            meta: {
              title: 'Commit | Speckle'
            },
            component: () => import('@/cleanup/pages/stream/Commit.vue')
          },
          {
            path: 'objects/:objectId',
            name: 'objects',
            meta: {
              title: 'Object | Speckle'
            },
            component: () => import('@/views/stream/Object.vue')
          },
          {
            path: 'activity/',
            name: 'activity',
            meta: {
              title: 'Stream Activity | Speckle'
            },
            props: true,
            component: () => import('@/views/stream/Activity.vue')
          },
          {
            path: 'collaborators/',
            name: 'collaborators',
            meta: {
              title: 'Stream Collaborators | Speckle'
            },
            props: true,
            component: () => import('@/views/stream/CollaboratorsManage.vue')
          },
          {
            path: 'settings/',
            name: 'settings',
            meta: {
              title: 'Stream Settings | Speckle'
            },
            props: true,
            component: () => import('@/views/stream/Settings.vue')
          },
          {
            path: 'webhooks/',
            name: 'webhooks',
            meta: {
              title: 'Webhooks | Speckle'
            },
            props: true,
            component: () => import('@/views/stream/Webhooks.vue')
          },
          {
            path: 'uploads/',
            name: 'uploads',
            meta: {
              title: 'Stream Uploads | Speckle'
            },
            props: true,
            component: () => import('@/views/stream/Uploads.vue')
          },
          {
            path: 'globals/',
            name: 'globals',
            meta: {
              title: 'Globals | Speckle'
            },
            props: true,
            component: () => import('@/views/stream/Globals.vue')
          },
          {
            path: 'globals/:commitId',
            name: 'previous globals',
            meta: {
              title: 'Globals | Speckle'
            },
            component: () => import('@/views/stream/Globals.vue')
          }
        ]
      },
      {
        path: 'profile',
        name: 'profile',
        meta: {
          title: 'Your Profile | Speckle',
          showBottomNavActions: true
        },
        component: () => import('@/views/Profile.vue')
      },
      {
        path: 'profile/:userId',
        name: 'user profile',
        meta: {
          title: 'User Profile | Speckle',
          showBottomNavActions: true
        },
        component: () => import('@/views/ProfileUser.vue')
      },
      {
        path: 'admin',
        meta: {
          title: 'Admin | Overview'
        },
        redirect: 'admin/dashboard',
        component: () => import('@/views/admin/Admin.vue'),
        children: [
          {
            name: 'Admin | Overview',
            path: 'dashboard',
            component: () => import('@/views/admin/AdminOverview.vue')
          },
          {
            name: 'Admin | Users',
            path: 'users',
            component: () => import('@/views/admin/AdminUsers.vue'),
            props: (route) => ({ ...route.query, ...route.props })
          },
          {
            name: 'Admin | Streams',
            path: 'streams',
            component: () => import('@/views/admin/AdminStreams.vue'),
            props: (route) => ({ ...route.query, ...route.props })
          },
          {
            name: 'Admin | Settings',
            path: 'settings',
            component: () => import('@/views/admin/AdminSettings.vue')
          },
          {
            name: 'Admin | Invites',
            path: 'invites',
            component: () => import('@/views/admin/AdminInvites.vue')
          }
        ]
      }
    ]
  },
  {
    path: '/error',
    name: 'Error',
    meta: {
      title: 'Error | Speckle'
    },
    component: () => import('@/views/Error.vue')
  },
  {
    path: '/onboarding',
    name: 'Onboarding | Speckle',
    meta: {
      title: 'Getting Started | Speckle'
    },
    component: () => import('@/views/GettingStartedView.vue')
  },
  {
    path: '*',
    name: 'notfound',
    meta: {
      title: 'Not Found | Speckle'
    },
    component: () => import('@/views/NotFound.vue')
  }
]

const router = new VueRouter({
  mode: 'history',
  // base: process.env.BASE_URL,
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { x: 0, y: 0 }
    }
  }
})

router.beforeEach((to, from, next) => {
  let uuid = localStorage.getItem('uuid')
  let redirect = localStorage.getItem('shouldRedirectTo')
  router.app.$eventHub.$emit('page-load', true)

  if (
    !uuid &&
    !to.matched.some(({ name }) => name === 'stream' || name === 'commit' || name === 'branch') && //allow public streams to be viewed
    to.name !== 'Embeded Viewer' &&
    to.name !== 'Login' &&
    to.name !== 'Register' &&
    to.name !== 'Error' &&
    to.name !== 'Reset Password' &&
    to.name !== 'Reset Password Finalization'
  ) {
    localStorage.setItem('shouldRedirectTo', to.path)

    return next({ name: 'Login' })
  }

  if ((to.name === 'Login' || to.name === 'Register') && uuid) {
    return next({ name: 'home' })
  }

  if (uuid && redirect && redirect !== to.path) {
    localStorage.removeItem('shouldRedirectTo')
    return next({ path: redirect })
  }

  return next()
})

//TODO: include stream name in page title eg `My Cool Stream | Speckle`
router.afterEach((to) => {
  router.app.$eventHub.$emit('page-load', false)
  if (localStorage.getItem('shouldRedirectTo') === to.path)
    localStorage.removeItem('shouldRedirectTo')

  Vue.nextTick(() => {
    document.title = (to.meta && to.meta.title) || 'Speckle'
  })
})

export default router
