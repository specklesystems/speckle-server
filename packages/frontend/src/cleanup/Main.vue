<template>
  <v-app id="speckle">
    <v-navigation-drawer
      v-model="drawer"
      app
      floating
      :class="`grey ${$vuetify.theme.dark ? 'darken-4' : 'lighten-4'} elevation-1`"
      width="325"
    >
      <main-nav />
      <template v-if="$route.meta.showBottomNavActions" #append>
        <main-nav-bottom />
      </template>
    </v-navigation-drawer>

    <v-app-bar app class="elevation-0 transparent" flat style="margin-top: 4px">
      <v-card class="d-flex flex-grow-1 overflow-hidden align-center elevation-2">
        <div>
          <v-app-bar-nav-icon @click.stop="drawer = !drawer">
            <v-icon>{{ drawer ? 'mdi-backburger' : 'mdi-menu' }}</v-icon>
          </v-app-bar-nav-icon>
        </div>
        <div class="d-flex align-center overflow-hidden" style="flex-grow: 1">
          <portal-target name="toolbar" class="text-truncate" />
        </div>
        <div class="text-right">
          <portal-target name="actions">
            <v-text-field
              class="float-right"
              style="width: 100%"
              placeholder="Search Streams"
              prepend-inner-icon="mdi-magnify"
              hide-details
              solo
              dense
              flat
            ></v-text-field>
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
      drawer: true
    }
  },
  methods: {
    switchTheme() {
      this.$vuetify.theme.dark = !this.$vuetify.theme.dark
      localStorage.setItem('darkModeEnabled', this.$vuetify.theme.dark ? 'dark' : 'light')
    },
    onScroll(e) {
      console.log(e)
    }
  }
}
</script>
<style scoped>
.ps {
  height: 100%;
  -ms-overflow-style: none; /* for Internet Explorer, Edge */
  scrollbar-width: none; /* for Firefox */
  overflow-y: scroll;
}
.ps::-webkit-scrollbar {
  display: none;
}
</style>
