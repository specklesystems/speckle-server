<template>
  <v-menu v-if="user" bottom left offset-y>
    <template #activator="{ on, attrs }">
      <v-btn icon v-bind="attrs" height="38" width="38" class="ml-3" v-on="on">
        <v-avatar color="background" size="38">
          <v-img v-if="user.avatar" :src="user.avatar" />
          <v-img v-else :src="`https://robohash.org/` + user.id + `.png?size=38x38`" />
        </v-avatar>
      </v-btn>
    </template>
    <v-list class="py-0 my-0">
      <v-list-item to="/profile">
        <v-list-item-content>
          <v-list-item-title>
            <b>{{ user.name }}</b>
          </v-list-item-title>
          <v-list-item-subtitle>View your profile</v-list-item-subtitle>
        </v-list-item-content>
        <v-list-item-action>
          <v-icon small>mdi-account</v-icon>
        </v-list-item-action>
      </v-list-item>
      <v-list-item v-if="!this.$vuetify.theme.dark" link @click="switchTheme">
        <v-list-item-content>
          <v-list-item-title>Dark theme</v-list-item-title>
          <v-list-item-subtitle>Switch to a dark theme</v-list-item-subtitle>
        </v-list-item-content>
        <v-list-item-action>
          <v-icon small>mdi-weather-night</v-icon>
        </v-list-item-action>
      </v-list-item>
      <v-list-item v-else exact @click="switchTheme">
        <v-list-item-content>
          <v-list-item-title>Light theme</v-list-item-title>
          <v-list-item-subtitle>Switch to a light theme</v-list-item-subtitle>
        </v-list-item-content>
        <v-list-item-action>
          <v-icon small>mdi-white-balance-sunny</v-icon>
        </v-list-item-action>
      </v-list-item>
      <v-divider></v-divider>
      <v-list-item @click="signOut">
        <v-list-item-content class="error--text">Sign out</v-list-item-content>
        <v-list-item-action>
          <v-icon small class="error--text">mdi-exit-to-app</v-icon>
        </v-list-item-action>
      </v-list-item>
    </v-list>
  </v-menu>
</template>
<script>
import { signOut } from '@/auth-helpers'
export default {
  props: {
    user: {
      type: Object,
      default: null
    },
    size: {
      type: Number,
      default: 42
    },
    id: {
      type: String,
      default: null
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
