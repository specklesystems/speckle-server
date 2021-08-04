<template>
  <v-app id="speckle">
    <v-app-bar app clipped-left>
      
      <!-- DESKTOP APP BAR -->
      <v-container
      
        class="py-0 fill-height hidden-md-and-down"
      >
      <v-app-bar-nav-icon v-if="isStreamPage" @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
        <v-btn text to="/" active-class="no-active">
          <v-img class="" contain max-height="30" max-width="30" src="@/assets/logo.svg" />
          <div class="logo">
            <span><b>Speckle</b></span>
          </div>
        </v-btn>
        <span class="mr-5">|</span>
        <span v-if="serverInfo" v-tooltip="`Version: `+serverInfo.version" class="subtitle-2">{{ serverInfo.name }}</span>
        <span v-if="serverInfo && isDevServer" v-tooltip="`This is a test server and should not be used in production!`" class="ml-4" >⚠️</span>
        <span v-if="loggedIn">
            <v-btn
          v-for="link in navLinks"
          
          :key="link.name"
          text
          exact
          class="text-uppercase ml-5"
          :to="link.link"
        >
          {{ link.name }}
        </v-btn>
        </span>
      
        <v-spacer></v-spacer>
        <v-responsive v-if="user" max-width="300">
          <search-bar />
        </v-responsive>
        <user-menu-top v-if="user" :user="user" />
        <v-btn v-else color="primary" to="/authn/login">
          <v-icon left>mdi-account-arrow-right</v-icon>
          Log in
        </v-btn>
      </v-container>
      <!-- MOBILE APP BAR -->
      <v-container class="hidden-lg-and-up">
        <v-row>
          <v-col>
           <v-app-bar-nav-icon v-if="isStreamPage" @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
          </v-col>
          <v-col class="text-center">

 <v-menu
              v-if="loggedIn"
              :value="showMobileMenu"
              transition="slide-y-transition"
              bottom
              offset-y
              :close-on-content-click="false"
              min-width="100%"
            >
              <template #activator="{ on, attrs }">
                <v-btn active-class="no-active" large icon text v-bind="attrs" v-on="on" @click="showMobileMenu = true">
                  <v-img contain max-height="40" max-width="40" src="@/assets/logo.svg" />
                </v-btn>
              </template>
              <v-card>
                <v-row>
                  <v-col v-for="link in navLinks" :key="link.name" cols="12">
                    <v-btn text block :to="link.link" exact>
                      {{ link.name }}
                    </v-btn>
                  </v-col>
                  <v-col cols="12" class="px-10 pb-7">
                    <v-divider class="mb-5"></v-divider>
                    <search-bar />
                  </v-col>
                </v-row>
              </v-card>
            </v-menu>



          </v-col>
          <v-col class="text-right" style="margin-top: 5px">
            <user-menu-top v-if="user" :user="user" />
          </v-col>
        </v-row>
      </v-container>
    </v-app-bar>
    <v-navigation-drawer v-if="isStreamPage && stream" v-model="drawer" app clipped left>
      <v-list>
        <v-subheader>Stream menu</v-subheader>
        <v-list-item-group color="primary">
          <v-list-item
            v-for="menu in menues"
            :key="menu.name"
            :to="menu.to"
            :disabled="menu.disabled"
            exact
            @click="handleFunction(menu.click)"
          >
            <v-list-item-icon>
              <v-icon>{{ menu.icon }}</v-icon>
            </v-list-item-icon>

            <v-list-item-content>
              <v-list-item-title>{{ menu.name }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-item-group>
      </v-list>
      <div class="mx-5 m t-5">
      <v-btn
        v-if="stream.role === 'stream:owner'"
        outlined
        color="primary"
        rounded
        block
        height="50"
     
        @click="showStreamInviteDialog"
      >
        <v-icon small class="mr-2">mdi-email-send-outline</v-icon>
        Invite to this
        <br />
        stream by email
      </v-btn>
      </div>
      <stream-invite-dialog ref="streamInviteDialog" :stream-id="stream.id" />
    </v-navigation-drawer>
    <v-main :style="background">
      <router-view></router-view>
      <v-snackbar
        v-if="streamSnackbarInfo"
        v-model="streamSnackbar"
        :timeout="5000"
        color="primary"
        absolute
        right
        top
      >
        <b>New stream!</b></br>
        <i v-if="streamSnackbarInfo && streamSnackbarInfo.name">{{ streamSnackbarInfo.name }}</i>
        <span v-else>available</span>
        <template #action="{ attrs }">
          <v-btn
            v-if="streamSnackbarInfo"
            text
            v-bind="attrs"
            :to="'/streams/' + streamSnackbarInfo.id"
            @click="streamSnackbar = false"
          >
            see
          </v-btn>
          <!-- <v-btn icon v-bind="attrs" @click="streamSnackbar = false">
            <v-icon>mdi-close</v-icon>
          </v-btn> -->
        </template>
      </v-snackbar>
    </v-main>
  </v-app>
</template>
<script>
import gql from 'graphql-tag'
import userQuery from '../graphql/user.gql'
import UserMenuTop from '../components/UserMenuTop'
import SearchBar from '../components/SearchBar'
import StreamInviteDialog from '../components/dialogs/StreamInviteDialog'

export default {
  components: { UserMenuTop, SearchBar, StreamInviteDialog },
  data() {
    return {
      search: '',
      drawer: true,
      streamSnackbar: false,
      streamSnackbarInfo: {},
      showMobileMenu: false,
      streams: { items: [] },
      selectedSearchResult: null,
      navLinks: [
        { link: '/', name: 'feed' },
        { link: '/streams', name: 'streams' },
        { link: '/profile', name: 'profile' }
      ]
    }
  },

  apollo: {
    stream: {
      query: gql`
        query Stream($id: String!) {
          stream(id: $id) {
            id
            name
            role
          }
        }
      `,
      variables() {
        return {
          id: this.$route.params.streamId
        }
      },
      skip() {
        return !this.isStreamPage
      }
    },
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
    isDevServer(){
      return (this.serverInfo.version[0]!=="v" ) ? true : false
    },
    loggedIn() {
      return localStorage.getItem('uuid') !== null
    },
    isStreamPage() {
      return this.$route.params.streamId && this.loggedIn
    },
    menues() {
      return [
        {
          name: 'Details',
          icon: 'mdi-compare-vertical',
          to: '/streams/' + this.$route.params.streamId
        },
        {
          name: 'Activity',
          icon: 'mdi-history',
          to: '/streams/' + this.$route.params.streamId + '/activity'
        },
        {
          name: 'Branches',
          icon: 'mdi-source-branch',
          to: '/streams/' + this.$route.params.streamId + '/branches'
        },
        {
          name: 'Globals',
          icon: 'mdi-earth',
          to: '/streams/' + this.$route.params.streamId + '/globals'
        },
        {
          name: 'Collaborators',
          icon: 'mdi-account-group-outline',
          to: '/streams/' + this.$route.params.streamId + '/collaborators',
          disabled: this.stream.role !== 'stream:owner'
        },
        {
          name: 'Webhooks',
          icon: 'mdi-webhook',
          to: '/streams/' + this.$route.params.streamId + '/webhooks',
          disabled: this.stream.role !== 'stream:owner'
        },
        {
          name: 'Settings',
          icon: 'mdi-cog-outline',
          to: '/streams/' + this.$route.params.streamId + '/settings',
          disabled: this.stream.role !== 'stream:owner'
        }
      ]
    }
  },
  watch: {
    $route() {
      this.showMobileMenu = false
    }
  },

  methods: {
    handleFunction(f) {
      if (this[f]) this[f]()
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
  transition: opacity 1s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}

.no-hover:before {display: none}
</style>
