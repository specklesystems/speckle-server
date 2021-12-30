<template>
  <div class="elevation-10">
    <portal-target name="nav-bottom">
      <v-list nav dense>
        <v-subheader>General</v-subheader>
        <v-list-item
          link
          href="https://speckle.community/new-topic?category=features"
          target="_blank"
          dark
        >
          <v-list-item-icon>
            <v-icon small class="ml-1 primary--text">mdi-comment-arrow-right</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title class="primary--text">Feedback</v-list-item-title>
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
        <v-list-item link @click="signOut()">
          <v-list-item-icon>
            <v-icon small class="ml-1">mdi-account-off</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Logout</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-btn block x-small rounded class="my-2" @click="switchTheme">
          <v-icon x-small>
            {{ $vuetify.theme.dark ? 'mdi-white-balance-sunny' : 'mdi-weather-night' }}
          </v-icon>
          <!-- {{ $vuetify.theme.dark ? 'Light' : 'Dark' }} Theme -->
        </v-btn>
      </v-list>
    </portal-target>
  </div>
</template>
<script>
import { signOut } from '@/auth-helpers'
import userQuery from '@/graphql/user.gql'

export default {
  apollo: {
    user: {
      query: userQuery,
      skip() {
        return !this.loggedIn
      }
    }
  },
  methods: {
    signOut() {
      signOut()
    },
    switchTheme() {
      this.$vuetify.theme.dark = !this.$vuetify.theme.dark
      localStorage.setItem('darkModeEnabled', this.$vuetify.theme.dark ? 'dark' : 'light')
    }
  }
}
</script>
