import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: '/authn',
    name: 'Auth',
    redirect: '/authn/login',
    component: () => import('@/main/layouts/TheAuth.vue'),
    children: [
      {
        path: 'login',
        name: 'Login',
        meta: {
          title: 'Login | Speckle'
        },
        component: () => import('@/main/pages/auth/TheLogin.vue')
      },
      {
        path: 'register',
        name: 'Register',
        meta: {
          title: 'Register | Speckle'
        },
        component: () => import('@/main/pages/auth/TheRegistration.vue')
      },
      {
        path: 'resetpassword',
        name: 'Reset Password',
        meta: {
          title: 'Register | Speckle'
        },
        component: () => import('@/main/pages/auth/ResetPasswordRequest.vue')
      },
      {
        path: 'resetpassword/finalize',
        name: 'Reset Password Finalization',
        meta: {
          title: 'Register | Speckle'
        },
        component: () => import('@/main/pages/auth/ResetPasswordFinalization.vue')
      },
      {
        path: 'verify/:appId/:challenge',
        name: 'Authorize App',
        meta: {
          title: 'Authorizing App | Speckle'
        },
        component: () => import('@/main/pages/auth/AuthorizeApp.vue')
      }
    ]
  },
  {
    path: '/',
    meta: {
      title: 'Home | Speckle'
    },
    component: () => import('@/main/layouts/TheMain.vue'),
    children: [
      {
        path: '',
        name: 'home',
        meta: {
          title: 'Home | Speckle'
        },
        component: () => import('@/main/pages/TheFeed.vue')
      },
      {
        path: '/commits',
        name: 'commits',
        meta: {
          title: 'Commits | Speckle'
        },
        component: () => import('@/main/pages/TheCommits.vue')
      },
      {
        path: 'streams',
        name: 'streams',
        meta: {
          title: 'Streams | Speckle'
        },
        component: () => import('@/main/pages/TheStreams.vue')
      },
      {
        path: 'streams/favorite',
        name: 'favorite-streams',
        meta: {
          title: 'Favorite Streams | Speckle'
        },
        component: () => import('@/main/pages/TheFavoriteStreams.vue')
      },
      {
        path: 'streams/:streamId',
        meta: {
          title: 'Stream | Speckle'
        },
        component: () => import('@/main/pages/stream/TheStream.vue'),
        children: [
          {
            path: '',
            name: 'stream',
            meta: {
              title: 'Stream | Speckle'
            },
            component: () => import('@/main/pages/stream/TheStreamHome.vue')
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
            component: () => import('@/main/pages/stream/TheBranch.vue'),
            beforeEnter: (to, from, next) => {
              if (to.params.branchName.toLowerCase() !== to.params.branchName)
                return next(
                  `/streams/${
                    to.params.streamId
                  }/branches/${to.params.branchName.toLowerCase()}`
                )
              else next()
            }
          },
          {
            path: 'comments/',
            name: 'comments',
            meta: {
              title: 'Stream Comments | Speckle',
              resizableNavbar: false
            },
            component: () => import('@/main/pages/stream/TheComments.vue')
          },
          {
            path: 'commits/:resourceId*',
            name: 'commit',
            meta: {
              title: 'Commit | Speckle',
              resizableNavbar: true,
              hideEmailBanner: true
            },
            component: () => import('@/main/pages/stream/CommitObjectViewer.vue')
          },
          {
            path: 'objects/:resourceId*',
            name: 'objects',
            meta: {
              title: 'Object | Speckle',
              resizableNavbar: true,
              hideEmailBanner: true
            },
            component: () => import('@/main/pages/stream/CommitObjectViewer.vue')
          },
          {
            path: 'collaborators/',
            name: 'collaborators',
            meta: {
              title: 'Stream Collaborators | Speckle'
            },
            props: true,
            component: () => import('@/main/pages/stream/TheCollaborators.vue')
          },
          {
            path: 'settings/',
            name: 'settings',
            meta: {
              title: 'Stream Settings | Speckle'
            },
            props: true,
            component: () => import('@/main/pages/stream/TheSettings.vue')
          },
          {
            path: 'webhooks/',
            name: 'webhooks',
            meta: {
              title: 'Webhooks | Speckle'
            },
            props: true,
            component: () => import('@/main/pages/stream/TheWebhooks.vue')
          },
          {
            path: 'uploads/',
            name: 'uploads',
            meta: {
              title: 'Stream Uploads | Speckle'
            },
            props: true,
            component: () => import('@/main/pages/stream/TheUploads.vue')
          },
          {
            path: 'globals/',
            name: 'globals',
            meta: {
              title: 'Globals | Speckle'
            },
            props: true,
            component: () => import('@/main/pages/stream/TheGlobals.vue')
          },
          {
            path: 'globals/:commitId',
            name: 'previous globals',
            meta: {
              title: 'Globals | Speckle'
            },
            component: () => import('@/main/pages/stream/TheGlobals.vue')
          }
        ]
      },
      {
        path: 'profile',
        name: 'profile',
        meta: {
          title: 'Your Profile | Speckle'
        },
        component: () => import('@/main/pages/user/TheProfileSelf.vue')
      },
      {
        path: 'profile/:userId',
        name: 'user profile',
        meta: {
          title: 'User Profile | Speckle'
        },
        component: () => import('@/main/pages/user/TheProfileUser.vue')
      },
      {
        path: 'admin',
        meta: {
          title: 'Admin | Overview'
        },
        redirect: 'admin/dashboard',
        component: () => import('@/main/pages/admin/Admin.vue'),
        children: [
          {
            name: 'Admin | Overview',
            path: 'dashboard',
            component: () => import('@/main/pages/admin/Dashboard.vue')
          },
          {
            name: 'Admin | Users',
            path: 'users',
            component: () => import('@/main/pages/admin/Users.vue'),
            props: (route) => ({ ...route.query, ...route.props })
          },
          {
            name: 'Admin | Streams',
            path: 'streams',
            component: () => import('@/main/pages/admin/Streams.vue'),
            props: (route) => ({ ...route.query, ...route.props })
          },
          {
            name: 'Admin | Settings',
            path: 'settings',
            component: () => import('@/main/pages/admin/ServerSettings.vue')
          },
          {
            name: 'Admin | Invites',
            path: 'invites',
            component: () => import('@/main/pages/admin/Invites.vue')
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
    component: () => import('@/main/pages/common/TheError.vue')
  },
  {
    path: '/onboarding',
    name: 'Onboarding | Speckle',
    meta: {
      title: 'Getting Started | Speckle'
    },
    component: () => import('@/main/pages/onboarding/TheOnboarding.vue')
  },
  {
    path: '*',
    name: 'notfound',
    meta: {
      title: 'Not Found | Speckle'
    },
    component: () => import('@/main/pages/common/NotFound.vue')
  }
  // NOTE: only used for local debugging of the full embed app.
  // (I might be missing something obvious though!)
  // {
  //   path: '/embed*',
  //   meta: {
  //     title: 'Embed View | Speckle'
  //   },
  //   component: () => import('@/embed/EmbedViewer.vue')
  // }
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
  const uuid = localStorage.getItem('uuid')
  const redirect = localStorage.getItem('shouldRedirectTo')
  router.app.$eventHub.$emit('page-load', true)

  if (
    !uuid &&
    !to.matched.some(
      ({ name }) => name === 'stream' || name === 'commit' || name === 'branch'
    ) && //allow public streams to be viewed
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
