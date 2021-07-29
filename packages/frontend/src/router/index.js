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
    component: () => import('@/views/Frontend.vue'),
    children: [
      {
        path: '',
        name: 'home',
        meta: {
          title: 'Home | Speckle'
        },
        component: () => import('@/views/Timeline.vue')
      },
      {
        path: 'streams',
        name: 'streams',
        meta: {
          title: 'Streams | Speckle'
        },
        component: () => import('@/views/Streams.vue')
      },
      {
        path: 'streams/:streamId',
        meta: {
          title: 'Stream | Speckle'
        },
        component: () => import('@/views/stream/Stream.vue'),
        children: [
          {
            path: '',
            name: 'stream',
            meta: {
              title: 'Stream | Speckle'
            },
            component: () => import('@/views/stream/Details.vue')
          },

          {
            path: 'branches/',
            name: 'branches',
            meta: {
              title: 'Branches | Speckle'
            },
            component: () => import('@/views/stream/Branches.vue')
          },
          {
            path: 'branches/:branchName',
            name: 'branch',
            meta: {
              title: 'Branch | Speckle'
            },
            component: () => import('@/views/stream/Branch.vue')
          },
          {
            path: 'commits/:commitId',
            name: 'commit',
            meta: {
              title: 'Commit | Speckle'
            },
            component: () => import('@/views/stream/Commit.vue')
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
            component: () => import('@/views/stream/Collaborators.vue')
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
            component: () => import('@/views/stream/Webhooks.vue'),
            children: [
              {
                path: 'edit/:webhookId/',
                name: 'edit webhook',
                props: true
              }
            ]
          },
          {
            path: 'webhooks/new/',
            name: 'add webhook',
            props: true,
            component: () => import('@/views/stream/Webhooks.vue')
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
          title: 'Your Profile | Speckle'
        },
        component: () => import('@/views/Profile.vue')
      },
      {
        path: 'profile/:userId',
        name: 'user profile',
        meta: {
          title: 'User Profile | Speckle'
        },
        component: () => import('@/views/ProfileUser.vue')
      },
      {
        path: 'admin',
        meta: {
          title: 'Admin | Overview'
        },
        children: [
          {
            name: 'Admin | Overview',
            path: '',
            component: () => import('@/views/admin/AdminOverview.vue')
          },
          {
            name: 'Admin | Users',
            path: 'users',
            component: () => import('@/views/admin/AdminUsers.vue')
          },
          {
            name: 'Admin | Streams',
            path: 'streams',
            component: () => import('@/views/admin/AdminStreams.vue')
          },
          {
            name: 'Admin | Settings',
            path: 'settings',
            component: () => import('@/views/admin/AdminSettings.vue')
          }
        ],
        component: () => import('@/views/admin/AdminPanel.vue')
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
    path: '/embed',
    name: 'Embeded Viewer',
    component: () => import('@/views/EmbedViewer.vue')
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
  routes
})

router.beforeEach((to, from, next) => {
  let uuid = localStorage.getItem('uuid')
  let redirect = localStorage.getItem('shouldRedirectTo')
  if (
    !uuid &&
    !to.matched.some(({ name }) => name === 'stream' || name === 'commit') && //allow public streams to be viewed
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
  if (localStorage.getItem('shouldRedirectTo') === to.path)
    localStorage.removeItem('shouldRedirectTo')

  Vue.nextTick(() => {
    document.title = (to.meta && to.meta.title) || 'Speckle'
  })
})

export default router
