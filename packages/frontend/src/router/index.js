import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: '/authn',
    name: 'Auth',
    redirect: '/authn/login',
    component: () => import('../views/Auth.vue'),
    children: [
      {
        path: 'login',
        name: 'Login',
        meta: {
          title: 'Login | Speckle'
        },
        component: () => import('../views/auth/Login.vue')
      },
      {
        path: 'register',
        name: 'Register',
        meta: {
          title: 'Register | Speckle'
        },
        component: () => import('../views/auth/Registration.vue')
      },
      {
        path: 'resetpassword',
        name: 'Reset Password',
        meta: {
          title: 'Register | Speckle'
        },
        component: () => import('../views/auth/ResetPasswordRequest.vue')
      },
      {
        path: 'resetpassword/finalize',
        name: 'Reset Password Finalization',
        meta: {
          title: 'Register | Speckle'
        },
        component: () => import('../views/auth/ResetPasswordFinalization.vue')
      },
      {
        path: 'verify/:appId/:challenge',
        name: 'Authorize App',
        meta: {
          title: 'Authorizing App | Speckle'
        },
        component: () => import('../views/auth/AuthorizeApp.vue')
      }
    ]
  },
  {
    path: '/',
    meta: {
      title: 'Home | Speckle'
    },
    component: () => import('../views/Frontend.vue'),
    children: [
      {
        path: '',
        name: 'home',
        meta: {
          title: 'Streams | Speckle'
        },
        component: () => import('../views/Streams.vue')
      },
      {
        path: 'streams/:streamId',
        name: 'streams',
        meta: {
          title: 'Stream | Speckle'
        },
        component: () => import('../views/Stream.vue'),
        children: [
          {
            path: '',
            name: 'stream',
            meta: {
              title: 'Stream | Speckle'
            },
            component: () => import('../views/StreamMain.vue')
          },
          {
            path: 'globals/',
            name: 'globals',
            meta: {
              title: 'Globals | Speckle'
            },
            component: () => import('../views/Globals.vue')
          },
          {
            path: 'globals/:commitId',
            name: 'previous globals',
            meta: {
              title: 'Globals | Speckle'
            },
            component: () => import('../views/Globals.vue')
          },
          {
            path: 'branches/',
            name: 'branches',
            meta: {
              title: 'Branches | Speckle'
            },
            component: () => import('../views/Branches.vue')
          },
          {
            path: 'branches/:branchName',
            name: 'branch',
            meta: {
              title: 'Branch | Speckle'
            },
            component: () => import('../views/StreamMain.vue')
          },
          {
            path: 'branches/:branchName/commits',
            name: 'commits',
            meta: {
              title: 'Commits | Speckle'
            },
            component: () => import('../views/Commits.vue')
          },
          {
            path: 'commits/:commitId',
            name: 'commit',
            meta: {
              title: 'Commit | Speckle'
            },
            component: () => import('../views/Commit.vue')
          },
          {
            path: 'objects/:objectId',
            name: 'objects',
            meta: {
              title: 'Object | Speckle'
            },
            component: () => import('../views/Object.vue')
          }
        ]
      },
      {
        path: 'profile',
        name: 'profile',
        meta: {
          title: 'Your Profile | Speckle'
        },
        component: () => import('../views/Profile.vue')
      },
      {
        path: 'profile/:userId',
        name: 'user profile',
        meta: {
          title: 'User Profile | Speckle'
        },
        component: () => import('../views/ProfileUser.vue')
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
            component: () => import('../views/admin/AdminOverview.vue')
          },
          {
            name: "Admin | Users",
            path: "users",
            component: () => import('../views/admin/AdminUsers.vue')

          },
          {
            name: "Admin | Streams",
            path: "streams",
            component: () => import('../views/admin/AdminStreams.vue')
          },
          {
            name: "Admin | Settings",
            path: "settings",
            component: () => import('../views/admin/AdminSettings.vue')
          }
        ],
        component: () => import('../views/admin/AdminPanel.vue')
      }
    ]
  },
  {
    path: '/error',
    name: 'Error',
    meta: {
      title: 'Error | Speckle'
    },
    component: () => import('../views/Error.vue')
  },
  {
    path: '/onboarding',
    name: 'Onboarding | Speckle',
    meta: {
      title: 'Getting Started | Speckle'
    },
    component: () => import('../views/GettingStartedView.vue')
  },
  {
    path: '/embed',
    name: 'Embeded Viewer',
    component: () => import('../views/EmbedViewer.vue')
  },
  {
    path: '*',
    name: 'notfound',
    meta: {
      title: 'Not Found | Speckle'
    },
    component: () => import('../views/NotFound.vue')
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
    !to.matched.some(({ name }) => name === 'streams') && //allow public streams to be viewed
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
