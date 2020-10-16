<template>
  <v-app id="speckle">
    <v-app-bar app color="background2" flat class="no-decor">
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
        <v-responsive max-width="300">
          <v-autocomplete
            v-model="selectedSearchResult"
            :loading="$apollo.loading"
            :items="streams.items"
            :search-input.sync="search"
            no-filter
            counter="3"
            rounded
            filled
            dense
            flat
            hide-no-data
            hide-details
            placeholder="Search streams..."
            item-text="name"
            item-value="id"
            return-object
            clearable
            append-icon=""
          >
            <template #item="{ item }" color="background">
              <v-list-item-content>
                <v-list-item-title>
                  <v-row class="pa-0 ma-0">
                    {{ item.name }}
                    <v-spacer></v-spacer>
                    <span class="streamid">{{ item.id }}</span>
                  </v-row>
                </v-list-item-title>
                <v-list-item-subtitle
                  v-text="item.description"
                ></v-list-item-subtitle>
                <v-list-item-subtitle class="caption">
                  Updated
                  <timeago :datetime="item.updatedAt"></timeago>
                </v-list-item-subtitle>
              </v-list-item-content>
            </template>
          </v-autocomplete>
        </v-responsive>
        <v-menu v-if="user" bottom left offset-y class="userMenu">
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
              <v-list-item
                v-if="!this.$vuetify.theme.dark"
                exact
                @click="switchTheme"
              >
                <v-list-item-content>Dark mode</v-list-item-content>
                <v-list-item-icon>
                  <v-icon>mdi-weather-night</v-icon>
                </v-list-item-icon>
              </v-list-item>
              <v-list-item v-else exact @click="switchTheme">
                <v-list-item-content>Light mode</v-list-item-content>
                <v-list-item-icon>
                  <v-icon>mdi-white-balance-sunny</v-icon>
                </v-list-item-icon>
              </v-list-item>
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
import gql from "graphql-tag"

export default {
  data: () => ({
    search: "",
    streams: { items: [] },
    selectedSearchResult: null,
    navLinks: [
      { link: "/streams", name: "streams" },
      { link: "/help", name: "help" }
    ]
  }),
  apollo: {
    user: {
      prefetch: true,
      query: userQuery
    },
    streams: {
      query: gql`
        query Streams($query: String) {
          streams(query: $query) {
            totalCount
            cursor
            items {
              id
              name
              description
              updatedAt
            }
          }
        }
      `,
      variables() {
        return {
          query: this.search
        }
      },
      skip() {
        return !this.search || this.search.length < 3
      }
    }
  },
  computed: {
    background() {
      let theme = this.$vuetify.theme.dark ? "dark" : "light"
      return `background-color: ${this.$vuetify.theme.themes[theme].background};`
    }
  },
  watch: {
    selectedSearchResult(val) {
      this.search = ""
      this.streams.items = []
      if (val)
        this.$router.push({ name: "stream", params: { streamId: val.id } })
    },
    "streams.items"(val) {
      console.log(val)
    }
  },

  methods: {
    switchTheme() {
      this.$vuetify.theme.dark = !this.$vuetify.theme.dark
      localStorage.setItem(
        "darkModeEnabled",
        this.$vuetify.theme.dark ? "dark" : "light"
      )
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

.no-decor a:hover {
  text-decoration: none;
}
.userMenu .v-list-item--active::before {
  opacity: 0;
}

.theme--dark {
  /* color: #cfcdcc !important; */
}
/* don't like fat text */
.v-list-item--dense .v-list-item__title,
.v-list-item--dense .v-list-item__subtitle,
.v-list--dense .v-list-item .v-list-item__title,
.v-list--dense .v-list-item .v-list-item__subtitle {
  font-weight: 400 !important;
}
</style>
