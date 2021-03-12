<template>
  <v-app id="speckle">
    <v-app-bar app>
      <v-container class="py-0 fill-height hidden-sm-and-down">
        <v-btn text to="/" active-class="no-active">
          <v-img class="" contain max-height="30" max-width="30" src="@/assets/logo.svg" />
          <div class="logo">
            <span><b>Speckle</b></span>
          </div>
        </v-btn>
        <span class="mr-5">|</span>
        <span v-if="serverInfo" class="subtitle-2">{{ serverInfo.name }}</span>
        <!-- <v-btn
          v-for="link in navLinks"
          :key="link.name"
          text
          class="text-uppercase"
          :to="link.link"
        >
          {{ link.name }}
        </v-btn> -->
        <v-spacer></v-spacer>
        <v-responsive max-width="300">
          <search-bar />
        </v-responsive>
        <user-menu-top :user="user" />
      </v-container>
      <v-container class="hidden-md-and-up">
        <v-row>
          <v-col>
            <v-menu
              :value="showMobileMenu"
              transition="slide-y-transition"
              bottom
              offset-y
              :close-on-content-click="false"
              min-width="100%"
            >
              <template #activator="{ on, attrs }">
                <v-btn icon v-bind="attrs" v-on="on" @click="showMobileMenu = true">
                  <v-icon>mdi-magnify</v-icon>
                </v-btn>
              </template>
              <v-card>
                <v-row>
                  <!-- <v-col v-for="link in navLinks" :key="link.name" cols="12">
                    <v-btn text block :to="link.link">
                      {{ link.name }}
                    </v-btn>
                  </v-col> -->
                  <v-col cols="12" class="px-10 pb-7">
                    <v-divider class="mb-5"></v-divider>
                    <search-bar />
                  </v-col>
                </v-row>
              </v-card>
            </v-menu>
          </v-col>
          <v-col class="text-center">
            <v-btn text to="/" active-class="no-active" large icon>
              <v-img contain max-height="40" max-width="40" src="@/assets/logo.svg" />
            </v-btn>
          </v-col>
          <v-col class="text-right" style="margin-top: 5px">
            <user-menu-top :user="user" />
          </v-col>
        </v-row>
      </v-container>
    </v-app-bar>
    <v-main :style="background">
      <router-view></router-view>
    </v-main>
  </v-app>
</template>
<script>
import gql from 'graphql-tag'
import userQuery from '../graphql/user.gql'
import UserMenuTop from '../components/UserMenuTop'
import SearchBar from '../components/SearchBar'

export default {
  components: { UserMenuTop, SearchBar },
  data() {
    return {
      loggedIn: null,
      search: '',
      showMobileMenu: false,
      streams: { items: [] },
      selectedSearchResult: null
      // navLinks: [
      //   { link: '/streams', name: 'streams' },
      //   { link: '/profile', name: 'profile' },
      //   { link: '/help', name: 'help' }
      // ]
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
          }
        }
      `
    },
    user: {
      query: userQuery
    }
  },
  computed: {
    background() {
      let theme = this.$vuetify.theme.dark ? 'dark' : 'light'
      return `background-color: ${this.$vuetify.theme.themes[theme].background};`
    }
  },
  watch: {
    $route() {
      this.showMobileMenu = false
    }
  },
  methods: {}
}
</script>
<style scoped>
.logo {
  font-family: Space Grotesk, sans-serif;
  text-transform: none;
  color: rgb(37, 99, 235);
  font-weight: 500;
  font-size: 1rem;
}
</style>
