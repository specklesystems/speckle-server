<template>
  <v-app id="speckle">
    <v-navigation-drawer
      app
      permanent
      mini-variant
      :expand-on-hover="true || $vuetify.breakpoint.mdAndUp"
      floating
      stateless
      fixed
      :color="`${$vuetify.theme.dark ? 'grey darken-4' : 'grey lighten-4'}`"
      :dark="$vuetify.theme.dark"
      style="z-index: 100"
      :class="`elevation-5`"
      @update:mini-variant="mini"
      mini-variant-width="56"
    >
      <v-toolbar class="transparent elevation-0">
        <v-toolbar-title class="space-grotesk primary--text">
          <router-link to="/" class="text-decoration-none">
            <v-img
              class="mt-2"
              max-width="30"
              src="@/assets/logo.svg"
              style="display: inline-block"
            />
          </router-link>
          <router-link
            to="/"
            class="text-decoration-none"
            style="position: relative; top: -4px; margin-left: 20px"
          >
            <span class="pb-4"><b>Speckle</b></span>
          </router-link>
        </v-toolbar-title>
      </v-toolbar>

      <v-list>
        <v-list-item link to="/" style="height: 59px">
          <v-list-item-icon>
            <v-icon>mdi-clock-fast</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Feed</v-list-item-title>
            <v-list-item-subtitle class="caption">Latest events.</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <v-list-item link to="/streams" style="height: 59px">
          <v-list-item-icon>
            <v-icon>mdi-folder</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Streams</v-list-item-title>
            <v-list-item-subtitle class="caption">All your streams.</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <!--   <v-list-item link to='/projects'>
          <v-list-item-icon>
            <v-icon>mdi-forum</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Projects</v-list-item-title>
          </v-list-item-content>
        </v-list-item>    
        
        <v-list-item link to='/viewer'>
          <v-list-item-icon>
            <v-icon>mdi-inbox</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Viewer</v-list-item-title>
          </v-list-item-content>
        </v-list-item> -->

        <v-list-item link to="/profile" v-if="user" style="height: 59px">
          <v-list-item-icon>
            <v-avatar size="25">
              <v-img v-if="user.avatar" :src="user.avatar" />
              <v-img v-else :src="`https://robohash.org/` + user.id + `.png?size=38x38`" />
            </v-avatar>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title>Profile</v-list-item-title>
            <v-list-item-subtitle class="caption">
              Your profile & dev settings.
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
        <v-divider></v-divider>
        <v-list-item v-if="serverInfo">
          <v-list-item-icon>
            <v-icon
              v-if="serverInfo && isDevServer"
              v-tooltip="`This is a test server and should not be used in production!`"
              color="red"
            >
              mdi-alert
            </v-icon>
            <v-icon v-else>mdi-information-variant</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title class="caption">{{ serverInfo.name }}</v-list-item-title>
            <v-list-item-subtitle class="caption">
              {{ serverInfo.version }}
            </v-list-item-subtitle>
            <div class="caption">This is a test server and should not be used in production!</div>
          </v-list-item-content>
        </v-list-item>
      </v-list>

      <template v-slot:append>
        <v-list dense>
          <v-list-item
            link
            href="https://speckle.community/new-topic?category=features"
            target="_blank"
            class="primary"
            dark
          >
            <v-list-item-icon>
              <v-icon small class="ml-1">mdi-comment-arrow-right</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Feedback</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item link @click="signOut()" color="primary" v-if="user">
            <v-list-item-icon>
              <v-icon small class="ml-1">mdi-account-off</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Logout</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item link to="/admin" color="primary" v-if="user && user.role === 'server:admin'">
            <v-list-item-icon>
              <v-icon small class="ml-1">mdi-cog</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Server Admin</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item link @click="switchTheme">
            <v-list-item-icon>
              <v-icon small class="ml-1">mdi-theme-light-dark</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Switch Theme</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </template>
    </v-navigation-drawer>
    <v-main style="overflow: hidden">
      <transition name="fade">
        <router-view></router-view>
      </transition>
      <transition name="fade">
        <div
          @click="showScrim = false"
          v-show="showScrim"
          class="hidden-sm-and-up"
          style="z-index: 10"
        >
          <v-overlay z-index="10"></v-overlay>
        </div>
      </transition>
    </v-main>
  </v-app>
</template>
<script>
import gql from 'graphql-tag'
import { signOut } from '@/auth-helpers'
import userQuery from '../graphql/user.gql'
import SearchBar from '../components/SearchBar'
import StreamInviteDialog from '../components/dialogs/StreamInviteDialog'

export default {
  components: { UserMenuTop, SearchBar, StreamInviteDialog },
  data() {
    return {
      streamSnackbar: false,
      streamSnackbarInfo: {},
      showScrim: false
    }
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
      query: userQuery,
      skip() {
        return !this.loggedIn
      }
    },
    $subscribe: {
      userStreamAdded: {
        query: gql`
          subscription {
            userStreamAdded
          }
        `,
        result(streamInfo) {
          if (!streamInfo.data.userStreamAdded) return
          this.streamSnackbar = true
          this.streamSnackbarInfo = streamInfo.data.userStreamAdded
        },
        skip() {
          return !this.loggedIn
        }
      }
    }
  },
  computed: {
    background() {
      let theme = this.$vuetify.theme.dark ? 'dark' : 'light'
      return `background-color: ${this.$vuetify.theme.themes[theme].background};`
    },
    isDevServer() {
      return this.serverInfo.version[0] !== 'v' ? true : false
    },
    loggedIn() {
      return localStorage.getItem('uuid') !== null
    }
  },
  methods: {
    help() {
      console.log('wtf')
    },
    mini(args) {
      this.showScrim = true
    },
    signOut() {
      signOut()
    },
    switchTheme() {
      this.$vuetify.theme.dark = !this.$vuetify.theme.dark
      localStorage.setItem('darkModeEnabled', this.$vuetify.theme.dark ? 'dark' : 'light')
    },
    showStreamInviteDialog() {
      this.$refs.streamInviteDialog.show()
    }
  }
}
</script>
<style>
.space-grotesk {
  font-family: 'Space Grotesk' !important;
}

.logo {
  font-family: 'Space Grotesk', sans-serif;
  text-transform: none;
  color: rgb(37, 99, 235);
  font-weight: 500;
  font-size: 1rem;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}

.no-hover:before {
  display: none;
}
</style>
