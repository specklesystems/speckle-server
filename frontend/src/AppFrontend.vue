<template>
  <v-app id="speckle">
    <v-app-bar app color="background2" flat>
      <v-container class="py-0 fill-height">
        <v-btn text to="/">
          <v-img
            contain
            max-height="30"
            max-width="30"
            src="./assets/logo.svg"
          />
          <div class="mt-1">
            <span class="primary--text"><b>SPECKLE</b></span>
            <!-- &nbsp;
            <span class="font-weight-light">ADMIN</span> -->
          </div>
        </v-btn>

        <v-btn
          v-for="link in navLinks"
          :key="link.name"
          text
          class="text-uppercase"
          :to="link.link"
        >
          {{ link.name }}
        </v-btn>

        <v-spacer></v-spacer>
        <v-responsive max-width="260">
          <v-text-field
            dense
            flat
            hide-details
            rounded
            solo-inverted
          ></v-text-field>
        </v-responsive>
        <v-menu v-if="user" bottom left offset-y>
          <template #activator="{ on, attrs }">
            <v-btn
              icon
              v-bind="attrs"
              height="38"
              width="38"
              class="ml-3"
              v-on="on"
            >
              <v-avatar color="background" size="38">
                <v-img v-if="user.avatar" :src="user.avatar" />
                <v-img
                  v-else
                  :src="`https://robohash.org/` + user.id + `.png?size=38x38`"
                />
              </v-avatar>
            </v-btn>
          </template>
          <v-list dense class="userMenu" color="background2">
            <v-list-item>
              <v-list-item-content class="caption">
                Signed in as:
                <strong>{{ user.name }}</strong>
              </v-list-item-content>
            </v-list-item>
            <v-divider></v-divider>
            <v-list-item-group>
              <v-list-item v-if="!isDark" inactive>
                <v-list-item-content>Dark mode</v-list-item-content>
                <v-list-item-action>
                  <v-btn icon @click="toggleDark">
                    <v-icon>mdi-weather-night</v-icon>
                  </v-btn>
                </v-list-item-action>
              </v-list-item>
              <v-list-item v-else inactive>
                <v-list-item-content>Light mode</v-list-item-content>
                <v-list-item-actions>
                  <v-btn icon @click="toggleDark">
                    <v-icon>mdi-white-balance-sunny</v-icon>
                  </v-btn>
                </v-list-item-actions>
              </v-list-item>
              <v-divider></v-divider>
              <!-- <v-list-item href="https://speckle.systems/" target="_blank">
                <v-list-item-content>SpeckleSystems</v-list-item-content>
              </v-list-item> -->
              <v-list-item @click="signOut">
                <v-list-item-content>Sign out</v-list-item-content>
              </v-list-item>
            </v-list-item-group>
          </v-list>
        </v-menu>
      </v-container>
    </v-app-bar>

    <v-main :style="background">
      <router-view></router-view>
    </v-main>
  </v-app>
</template>
<script>
import userQuery from "./graphql/user.gql"

export default {
  data: () => ({
    navLinks: [
      { link: "/streams", name: "streams" },
      { link: "/help", name: "help" }
    ]
  }),
  apollo: {
    user: {
      prefetch: true,
      query: userQuery
    }
  },
  computed: {
    background() {
      let theme = this.$vuetify.theme.dark ? "dark" : "light"
      return `background-color: ${this.$vuetify.theme.themes[theme].background};`
    },
    isDark() {
      let isDark = localStorage.getItem("darkModeEnabled") ?? false
      return isDark
    }
  },
  mounted() {
    this.$vuetify.theme.dark = this.isDark
  },
  methods: {
    toggleDark() {
      this.$vuetify.theme.dark = !this.$vuetify.theme.dark
      localStorage.setItem("darkModeEnabled", this.$vuetify.theme.dark)
    },
    signOut() {
      localStorage.clear()
      location.reload()
    }
  }
}
</script>
<style>
.v-card__text,
.v-card__title {
  word-break: normal !important;
}

.streamid {
  font-family: monospace !important;
}

a {
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

.userMenu a:hover {
  text-decoration: none;
}

.userMenu .v-list-item--active::before {
  opacity: 0;
}
.theme--dark {
  color: #cfcdcc !important;
}
</style>
