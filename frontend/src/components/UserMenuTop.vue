<template>
  <v-menu v-if="user" bottom left offset-y :nudge-width="230">
    <template #activator="{ on, attrs }">
      <v-btn icon v-bind="attrs" height="38" width="38" class="ml-3" v-on="on">
        <v-avatar color="background" size="38">
          <v-img v-if="user.avatar" :src="user.avatar" />
          <v-img
            v-else
            :src="`https://robohash.org/` + user.id + `.png?size=38x38`"
          />
        </v-avatar>
      </v-btn>
    </template>
    <v-list color="background2">
      <v-list-item to="/profile">
        <v-list-item-content>
          <b>{{ user.name }}</b>
        </v-list-item-content>
        <v-list-item-action>
          <v-icon small>mdi-account</v-icon>
        </v-list-item-action>
      </v-list-item>
      <v-list-item @click="signOut">
        <v-list-item-content>Sign out</v-list-item-content>
        <v-list-item-action>
          <v-icon small>mdi-exit-to-app</v-icon>
        </v-list-item-action>
      </v-list-item>
      <v-divider></v-divider>
      <v-list-item v-if="!this.$vuetify.theme.dark" link @click="switchTheme">
        <v-list-item-content>Dark mode</v-list-item-content>
        <v-list-item-icon>
          <v-icon small>mdi-weather-night</v-icon>
        </v-list-item-icon>
      </v-list-item>
      <v-list-item v-else exact @click="switchTheme">
        <v-list-item-content>Light mode</v-list-item-content>
        <v-list-item-icon>
          <v-icon small>mdi-white-balance-sunny</v-icon>
        </v-list-item-icon>
      </v-list-item>
    </v-list>
  </v-menu>
</template>
<script>
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
      localStorage.clear()
      location.reload()
    },
    switchTheme() {
      this.$vuetify.theme.dark = !this.$vuetify.theme.dark
      localStorage.setItem(
        "darkModeEnabled",
        this.$vuetify.theme.dark ? "dark" : "light"
      )
    }
  }
}
</script>
