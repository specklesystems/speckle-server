<template>
  <v-app id="speckle">
    <v-navigation-drawer
      :app="!$vuetify.breakpoint.xsOnly"
      permanent
      mini-variant
      :expand-on-hover="true || $vuetify.breakpoint.mdAndUp"
      floating
      stateless
      fixed
      :color="`${$vuetify.theme.dark ? 'grey darken-4' : 'grey lighten-4'}`"
      :dark="$vuetify.theme.dark"
      style="z-index: 100"
      :class="`elevation-5 hidden-xs-only`"
      mini-variant-width="56"
    >
      <v-toolbar class="transparent elevation-0">
        <v-toolbar-title class="space-grotesk primary--text">
          <router-link to="/" class="text-decoration-none">
            <v-img
              class="mt-2 hover-tada"
              width="24"
              src="@/assets/specklebrick.png"
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

        <v-list-item v-if="user" link to="/profile" style="height: 59px">
          <v-list-item-icon>
            <user-avatar-icon :size="24" :avatar="user.avatar" :seed="user.id"></user-avatar-icon>
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
              v-if="isDevServer"
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
            <div class="caption">
              {{ serverInfo.description }}
            </div>
          </v-list-item-content>
        </v-list-item>
      </v-list>

      <template #append>
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

          <v-list-item v-if="user" link color="primary" @click="signOut()">
            <v-list-item-icon>
              <v-icon small class="ml-1">mdi-account-off</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Logout</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item v-if="user && user.role === 'server:admin'" link to="/admin" color="primary">
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

    <v-bottom-navigation fixed xxx-hide-on-scroll class="hidden-sm-and-up elevation-20">
      <v-btn color="primary" text to="/" style="height: 100%">
        <span>Feed</span>
        <v-icon>mdi-clock-fast</v-icon>
      </v-btn>

      <v-btn color="primary" text to="/streams" style="height: 100%">
        <span>Streams</span>
        <v-icon>mdi-folder</v-icon>
      </v-btn>

      <v-btn color="primary" text to="/profile" style="height: 100%">
        <span>Profile</span>
        <v-icon>mdi-account</v-icon>
      </v-btn>

      <v-btn text style="height: 100%" @click="bottomSheet = true">
        <span>More</span>
        <v-icon>mdi-dots-horizontal</v-icon>
      </v-btn>
    </v-bottom-navigation>

    <v-bottom-sheet v-model="bottomSheet">
      <v-sheet class="">
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

          <v-list-item v-if="user" link color="primary" @click="signOut()">
            <v-list-item-icon>
              <v-icon small class="ml-1">mdi-account-off</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Logout</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item v-if="user && user.role === 'server:admin'" link to="/admin" color="primary">
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
      </v-sheet>
    </v-bottom-sheet>
    <v-main style="overflow: hidden">
      <transition name="fade">
        <router-view></router-view>
      </transition>
    </v-main>
    <v-snackbar
      v-model="streamSnackbar"
      rounded="pill"
      :timeout="10000"
      style="z-index: 10000"
      :color="`${$vuetify.theme.dark ? 'primary' : 'primary'}`"
    >
      <span v-if="streamSnackbarInfo.sharedBy">You have been granted access to a new stream!</span>
      <span v-else>New stream created!</span>
      <template #action="{ attrs }">
        <v-btn color="white" text v-bind="attrs" @click="goToStreamAndCloseSnackbar()">View</v-btn>
        <v-btn color="pink" icon v-bind="attrs" @click="streamSnackbar = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>
<script>
import gql from 'graphql-tag'
import { signOut } from '@/auth-helpers'
import userQuery from '../graphql/user.gql'
import UserAvatarIcon from '@/components/UserAvatarIcon'

export default {
  components: { UserAvatarIcon },
  data() {
    return {
      streamSnackbar: false,
      streamSnackbarInfo: {},
      bottomSheet: false
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
          console.log(streamInfo)
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
  watch: {
    $route(to) {
      this.bottomSheet = false
      // close the snackbar if it's a stream create event in this window
      if (to.params.streamId === this.streamSnackbarInfo.id) this.streamSnackbar = false
      this.bottomSheet = false
    }
  },
  methods: {
    signOut() {
      signOut()
    },
    switchTheme() {
      this.$vuetify.theme.dark = !this.$vuetify.theme.dark
      localStorage.setItem('darkModeEnabled', this.$vuetify.theme.dark ? 'dark' : 'light')
    },
    showStreamInviteDialog() {
      this.$refs.streamInviteDialog.show()
    },
    goToStreamAndCloseSnackbar() {
      this.streamSnackbar = false
      this.$router.push(`/streams/${this.streamSnackbarInfo.id}`)
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
