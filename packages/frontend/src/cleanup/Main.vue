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

    <v-app-bar app class="pa-0 elevation-0 transparent" fixed hide-on-scroll scroll-threshold="50">
      <v-card class="flex-grow-1 d-flex elevation-3 flex-column">
        <div class="d-flex flex-grow-1 align-center">
          <v-app-bar-nav-icon @click.stop="drawer = !drawer">
            <v-icon>{{ drawer ? 'mdi-minus' : 'mdi-menu' }}</v-icon>
          </v-app-bar-nav-icon>
          <portal-target name="title"></portal-target>
          <v-spacer></v-spacer>
          <portal-target name="actions">
            <v-text-field
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
      <transition name="fade">
        <router-view></router-view>
      </transition>
    </v-main>
    <global-toast />
  </v-app>
</template>
<script>
import userQuery from '@/graphql/user.gql'
import gql from 'graphql-tag'

export default {
  components: {
    MainNav: () => import('@/cleanup/navigation/MainNav'),
    MainNavBottom: () => import('@/cleanup/navigation/MainNavBottom'),
    GlobalToast: () => import('@/cleanup/components/common/GlobalToast')
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
    }
  }
}
</script>
