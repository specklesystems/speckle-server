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
        component: () => import('../views/Home.vue')
      },
      {
        path: 'streams',
        name: 'streams',
        meta: {
          title: 'Streams | Speckle'
        },
        component: () => import('../views/Streams.vue')
      },
      {
        path: 'streams/:streamId',
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
            path: 'branches/:branchName',
            name: 'branch',
            meta: {
              title: 'Branch | Speckle'
            },
            component: () => import('../views/Branch.vue')
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
        path: 'help',
        name: 'help',
        meta: {
          title: 'Help | Speckle'
        },
        component: () => import('../views/Help.vue')
      }
    ]
  },
  {
    path: '/about',
    name: 'about',
    meta: {
      title: 'About | Speckle'
    },
    component: () => import('../views/About.vue')
  },
  {
    path: '/error',
    name: 'error',
    meta: {
      title: 'Error | Speckle'
    },
    component: () => import('../views/Error.vue')
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

  if (!uuid && to.name !== 'Login' && to.name !== 'Register') {
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
router.afterEach((to, from) => {
  Vue.nextTick(() => {
    document.title = (to.meta && to.meta.title) || 'Speckle'
  })
})

export default router
