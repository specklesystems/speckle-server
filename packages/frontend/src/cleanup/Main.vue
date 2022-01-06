<template>
  <v-app id="speckle">
    <v-navigation-drawer
      ref="drawer"
      v-model="drawer"
      app
      floating
      :class="`grey ${$vuetify.theme.dark ? 'darken-4' : 'lighten-4'} elevation-1`"
      :width="navWidth"
    >
      <div
        v-show="$route.meta.resizableNavbar"
        class="nav-resizer"
        :class="`${$vuetify.theme.dark ? 'grey' : 'grey'}`"
      ></div>
      <main-nav :expanded="drawer" @hide-drawer="drawer = false" />
      <template #append>
        <main-nav-bottom />
      </template>
    </v-navigation-drawer>

    <v-app-bar
      hide-on-scroll
      scroll-treshold="300"
      app
      class="elevation-0 transparent"
      flat
      style="margin-top: 4px"
    >
      <v-card
        class="d-flex flex-grow-1 overflow-hidden align-center elevation-4"
        style="height: 48px"
      >
        <div v-if="!drawer">
          <v-app-bar-nav-icon @click.stop="drawer = !drawer">
            <v-icon>{{ drawer ? 'mdi-backburger' : 'mdi-menu' }}</v-icon>
          </v-app-bar-nav-icon>
        </div>
        <div v-else class="ml-4"></div>
        <div class="d-flex align-center overflow-hidden" style="flex-grow: 1">
          <portal-target name="toolbar" class="text-truncate" />
        </div>
        <div class="text-right">
          <portal-target name="actions">
            <div style="margin-right: -10px">
              <search-bar />
            </div>
          </portal-target>
        </div>
      </v-card>
    </v-app-bar>
    <v-main class="background">
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
import userQuery from '@/graphql/user.gql'
import gql from 'graphql-tag'

export default {
  components: {
    MainNav: () => import('@/cleanup/navigation/MainNav'),
    MainNavBottom: () => import('@/cleanup/navigation/MainNavBottom'),
    SearchBar: () => import('@/cleanup/components/common/SearchBar'),
    GlobalToast: () => import('@/cleanup/components/common/GlobalToast'),
    GlobalLoading: () => import('@/cleanup/components/common/GlobalLoading')
  },
  apollo: {
    serverInfo: {
      query: gql`
        query {
          serverInfo {
            name
            company
            description
            adminContact
            version
          }
        }
      `
    },
    user: {
      query: userQuery
    }
  },
  data() {
    return {
      newStreamDialog: 1,
      drawer: true,
      navWidth: 300,
      navRestWidth: 300,
      borderSize: 3
    }
  },
  watch: {
    $route(to, from) {
      if (!to.meta.resizableNavbar) {
        this.navWidth = this.navRestWidth
      }
      if (to.meta.resizableNavbar && window.__lastNavSize) {
        this.navWidth = window.__lastNavSize
      }
    }
  },
  mounted() {
    this.setNavResizeEvents()
  },
  methods: {
    switchTheme() {
      this.$vuetify.theme.dark = !this.$vuetify.theme.dark
      localStorage.setItem('darkModeEnabled', this.$vuetify.theme.dark ? 'dark' : 'light')
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
  width: 4px;
  height: 100%;
  z-index: 100000;
  transition: all 0.3s ease;
  opacity: 0.03;
}
.nav-resizer:hover {
  opacity: 0.5;
  width: 4px;
}
</style>
