<template>
  <v-app id="speckle">
    <v-app-bar app color="" class="no-decor">
      <v-container class="py-0 fill-height hidden-sm-and-down">
        <v-btn text to="/" active-class="no-active">
          <v-img
            contain
            max-height="30"
            max-width="30"
            src="./assets/logo.svg"
          />
          <div class="mt-1">
            <span class="primary--text"><b></b></span>
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
            <v-list-item
              v-if="!this.$vuetify.theme.dark"
              link
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
          </v-list>
        </v-menu>
      </v-container>
      <v-container class="hidden-md-and-up">
        <v-row>
          <v-col>
            <v-btn icon @click="showMobileMenu = !showMobileMenu">
              <v-icon v-if="!showMobileMenu">mdi-menu</v-icon>
              <v-icon v-else>mdi-close</v-icon>
            </v-btn>
          </v-col>
          <v-col class="text-center">
            <v-btn text to="/" active-class="no-active" icon>
              <v-img
                contain
                max-height="40"
                max-width="40"
                src="./assets/logo.svg"
              />
            </v-btn>
          </v-col>
          <v-col class="text-right">
            <v-menu v-if="user" bottom left offset-y class="userMenu">
              <template #activator="{ on, attrs }">
                <v-btn icon v-bind="attrs" v-on="on">
                  <v-avatar color="background" size="28">
                    <v-img v-if="user.avatar" :src="user.avatar" />
                    <v-img
                      v-else
                      :src="
                        `https://robohash.org/` + user.id + `.png?size=38x38`
                      "
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
                <v-list-item
                  v-if="!this.$vuetify.theme.dark"
                  link
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
                <v-list-item @click="signOut">
                  <v-list-item-content>Sign out</v-list-item-content>
                </v-list-item>
              </v-list>
            </v-menu>
          </v-col>
        </v-row>
      </v-container>
    </v-app-bar>
    <v-card
      v-show="showMobileMenu"
      style="position: relative; top: 40px"
      class="pa-5"
    >
      <v-row>
        <v-col v-for="link in navLinks" :key="link.name" cols="12">
          <v-btn text block :to="link.link">
            {{ link.name }}
          </v-btn>
        </v-col>
        <v-col cols="12">
          <v-divider class="mb-5"></v-divider>
          <v-autocomplete
            v-model="selectedSearchResult"
            class="mt-4"
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
        </v-col>
      </v-row>
    </v-card>
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
    showMobileMenu: false,
    streams: { items: [] },
    selectedSearchResult: null,
    navLinks: [
      { link: "/streams", name: "streams" },
      { link: "/profile", name: "profile" },
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
      },
      debounce: 300
    }
  },
  computed: {
    background() {
      let theme = this.$vuetify.theme.dark ? "dark" : "light"
      return `background-color: ${this.$vuetify.theme.themes[theme].background};`
    }
  },
  watch: {
    $route(to, from) {
      this.showMobileMenu = false
    },
    selectedSearchResult(val) {
      this.search = ""
      this.streams.items = []
      if (val)
        this.$router.push({ name: "stream", params: { streamId: val.id } })
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
  text-decoration-color: rgba(10, 102, 255, 0.25);
}

.no-decor a:hover {
  text-decoration: none;
}

.v-btn--active.no-active::before {
  opacity: 0 !important;
}

.hoverable-border {
  border: 1px transparent;
}

.hoverable-border:hover {
  border: 1px blue;
}

/* .theme--dark {
  /color: #cfcdcc !important;
} */

/* don't like fat text */
.v-list-item--dense .v-list-item__title,
.v-list-item--dense .v-list-item__subtitle,
.v-list--dense .v-list-item .v-list-item__title,
.v-list--dense .v-list-item .v-list-item__subtitle {
  font-weight: 400 !important;
}

/*WHYYYY*/
.v-tooltip__content {
  pointer-events: all !important;
  opacity: 1 !important;
}

/* DARK MODE HARD FIXES */

.theme--dark.v-list {
  background-color: #303132 !important;
}

/* TOOLTIPs */

.tooltip {
  display: block !important;
  z-index: 10000;
  font-family: "Roboto", sans-serif !important;
  font-size: 0.75rem !important;
}

.tooltip .tooltip-inner {
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border-radius: 16px;
  padding: 5px 10px 4px;
}

.tooltip .tooltip-arrow {
  width: 0;
  height: 0;
  border-style: solid;
  position: absolute;
  margin: 5px;
  border-color: rgba(0, 0, 0, 0.5);
  z-index: 1;
}

.tooltip[x-placement^="top"] {
  margin-bottom: 5px;
}

.tooltip[x-placement^="top"] .tooltip-arrow {
  border-width: 5px 5px 0 5px;
  border-left-color: transparent !important;
  border-right-color: transparent !important;
  border-bottom-color: transparent !important;
  bottom: -5px;
  left: calc(50% - 5px);
  margin-top: 0;
  margin-bottom: 0;
}

.tooltip[x-placement^="bottom"] {
  margin-top: 5px;
}

.tooltip[x-placement^="bottom"] .tooltip-arrow {
  border-width: 0 5px 5px 5px;
  border-left-color: transparent !important;
  border-right-color: transparent !important;
  border-top-color: transparent !important;
  top: -5px;
  left: calc(50% - 5px);
  margin-top: 0;
  margin-bottom: 0;
}

.tooltip[x-placement^="right"] {
  margin-left: 5px;
}

.tooltip[x-placement^="right"] .tooltip-arrow {
  border-width: 5px 5px 5px 0;
  border-left-color: transparent !important;
  border-top-color: transparent !important;
  border-bottom-color: transparent !important;
  left: -5px;
  top: calc(50% - 5px);
  margin-left: 0;
  margin-right: 0;
}

.tooltip[x-placement^="left"] {
  margin-right: 5px;
}

.tooltip[x-placement^="left"] .tooltip-arrow {
  border-width: 5px 0 5px 5px;
  border-top-color: transparent !important;
  border-right-color: transparent !important;
  border-bottom-color: transparent !important;
  right: -5px;
  top: calc(50% - 5px);
  margin-left: 0;
  margin-right: 0;
}

.tooltip.popover .popover-inner {
  background: #f9f9f9;
  color: black;
  padding: 24px;
  border-radius: 5px;
  box-shadow: 0 5px 30px rgba(black, 0.1);
}

.tooltip.popover .popover-arrow {
  border-color: #f9f9f9;
}

.tooltip[aria-hidden="true"] {
  visibility: hidden;
  opacity: 0;
  transition: opacity 0.15s, visibility 0.15s;
}

.tooltip[aria-hidden="false"] {
  visibility: visible;
  opacity: 1;
  transition: opacity 0.15s;
}
</style>
