<template>
  <v-app id="speckle">
    <v-navigation-drawer
      ref="drawer"
      v-model="drawer"
      app
      floating
      :class="`grey ${$vuetify.theme.dark ? 'darken-4' : 'lighten-4'} elevation-1`"
      :width="navWidth"
      style="z-index: 100"
    >
      <div v-show="$route.meta.resizableNavbar" class="nav-resizer"></div>
      <main-nav :expanded="drawer" @hide-drawer="drawer = false" />
      <template #append>
        <div
          :xxxstyle="`${$isMobile() ? 'padding-bottom: 58px' : ''}`"
          class="elevation-10"
        >
          <main-nav-bottom />
        </div>
      </template>
    </v-navigation-drawer>

    <v-app-bar app class="elevation-0 transparent" flat style="margin-top: 4px">
      <v-card
        class="d-flex flex-grow-1 overflow-hidden align-center elevation-4 rounded-lg"
        style="height: 48px"
      >
        <div v-if="!drawer">
          <v-app-bar-nav-icon @click.stop="drawer = !drawer">
            <v-icon>{{ drawer ? 'mdi-backburger' : 'mdi-menu' }}</v-icon>
          </v-app-bar-nav-icon>
        </div>
        <div v-else class="ml-4"></div>
        <div class="d-flex align-center overflow-hidden flex-shrink-1">
          <portal-target name="toolbar" class="text-truncate" />
        </div>
        <div class="d-flex text-right flex-grow-1 justify-end">
          <portal-target name="actions" class="d-flex align-center">
            <div style="margin-right: -10px">
              <search-bar />
            </div>
          </portal-target>
        </div>
      </v-card>
    </v-app-bar>
    <v-main class="background">
      <email-verification-banner
        v-if="!hideEmailBanner && user && !user.verified"
        :user="user"
        class="my-2 mx-4 email-banner"
      ></email-verification-banner>
      <v-container fluid class="px-4">
        <transition name="fade">
          <router-view></router-view>
        </transition>
      </v-container>
    </v-main>
    <global-toast />
    <global-loading />
  </v-app>
</template>
<script>
import { gql } from '@apollo/client/core'
import { mainUserDataQuery } from '@/graphql/user'
import { setDarkTheme } from '@/main/utils/themeStateManager'

export default {
  name: 'TheMain',
  components: {
    MainNav: () => import('@/main/navigation/MainNav'),
    MainNavBottom: () => import('@/main/navigation/MainNavBottom'),
    SearchBar: () => import('@/main/components/common/SearchBar'),
    GlobalToast: () => import('@/main/components/common/GlobalToast'),
    GlobalLoading: () => import('@/main/components/common/GlobalLoading'),
    EmailVerificationBanner: () =>
      import('@/main/components/user/EmailVerificationBanner')
  },
  apollo: {
    user: {
      query: mainUserDataQuery,
      skip() {
        return !this.$loggedIn()
      }
    },
    $subscribe: {
      userStreamAdded: {
        query: gql`
          subscription userStreamAdded {
            userStreamAdded
          }
        `,
        result({ data }) {
          if (!data || !data.userStreamAdded) return
          if (this.$route.params.streamId === data.userStreamAdded.id) return
          this.$eventHub.$emit('notification', {
            text: `You've got a new stream!`,
            action: {
              name: 'View Stream',
              to: `/streams/${data.userStreamAdded.id}`
            }
          })
        },
        skip() {
          return !this.user
        }
      }
    }
  },
  data() {
    return {
      newStreamDialog: 1,
      drawer: true,
      navWidth: 300,
      navRestWidth: 300,
      borderSize: 3,
      hideEmailBanner: false
    }
  },
  watch: {
    $route: {
      handler(to) {
        if (!to.meta.resizableNavbar) {
          this.navWidth = this.navRestWidth
        }
        if (to.meta.resizableNavbar && window.__lastNavSize) {
          this.navWidth = window.__lastNavSize
        }
        this.hideEmailBanner = !!to.meta.hideEmailBanner
      },
      immediate: true
    }
  },
  mounted() {
    this.setNavResizeEvents()

    if (this.$route.query.emailverfiedstatus) {
      setTimeout(() => {
        this.$eventHub.$emit('notification', {
          text: '✉️ Email successfully verfied!'
        })
      }, 1000) // todo: ask fabian if there's a better way, feels icky
    }
  },
  methods: {
    switchTheme() {
      this.$vuetify.theme.dark = !this.$vuetify.theme.dark
      setDarkTheme(this.$vuetify.theme.dark, true)

      this.$mixpanel.people.set(
        'Theme Web',
        this.$vuetify.theme.dark ? 'dark' : 'light'
      )
    },
    setNavResizeEvents() {
      const minSize = this.borderSize
      const el = this.$refs.drawer.$el
      const drawerBorder = el.querySelector('.nav-resizer')
      drawerBorder.style.cursor = 'ew-resize'

      function resize(e) {
        e.preventDefault()
        const maxWidth = document.body.offsetWidth / 2
        const minWidth = 300
        document.body.style.cursor = 'ew-resize'
        if (!(e.clientX > maxWidth || e.clientX < minWidth)) {
          el.style.width = e.clientX + 'px'
          window.__lastNavSize = e.clientX
        }
      }

      drawerBorder.addEventListener(
        'mousedown',
        (e) => {
          e.preventDefault()
          if (e.offsetX < minSize) {
            el.style.transition = 'initial'
            document.addEventListener('mousemove', resize, false)
          }
        },
        false
      )

      document.addEventListener(
        'mouseup',
        (e) => {
          e.preventDefault()
          el.style.transition = ''
          document.body.style.cursor = ''
          this.navWidth = el.style.width
          document.removeEventListener('mousemove', resize, false)
          setTimeout(() => this.$eventHub.$emit('resize-viewer'), 300)
        },
        false
      )
    }
  }
}
</script>
<style scoped>
.nav-resizer {
  position: absolute;
  top: 0;
  right: 0;
  width: 0px;
  height: 100%;
  z-index: 100000;
  transition: all 0.6s ease;
  opacity: 0.01;
  border: 4px solid royalblue;
}
.nav-resizer:hover {
  opacity: 0.5;
  width: 0px;
}
.email-banner {
  z-index: 2;
}
</style>
