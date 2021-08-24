<template>
  <!-- <v-container :fluid="$vuetify.breakpoint.mdAndDown"> -->
  <v-container style="padding-left: 56px" fluid>
    <v-navigation-drawer
      app
      fixed
      :permanent="streamNav && !$vuetify.breakpoint.smAndDown"
      v-model="streamNav"
      style="left: 56px"
      width="320"
    >
      <v-toolbar style="position: absolute; top: 0; width: 100%; z-index: 90" elevation="0">
        <search-bar />
      </v-toolbar>

      <v-list style="margin-top: 64px" shaped>
        <v-list-item class="primary" dark link @click="newStreamDialog = true">
          <v-list-item-content>
            <v-list-item-title>New Stream</v-list-item-title>
            <v-list-item-subtitle class="caption">
              Quickly create a new data repository.
            </v-list-item-subtitle>
          </v-list-item-content>
          <v-list-item-icon>
            <v-icon class="">mdi-plus-box</v-icon>
          </v-list-item-icon>
        </v-list-item>
        <v-list-item link @click="showServerInviteDialog()">
          <v-list-item-icon>
            <v-icon class="">mdi-email</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Invite</v-list-item-title>
            <v-list-item-subtitle class="caption">
              Invite a colleague to Speckle!
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </v-list>

      <div v-if="user">
        <v-subheader class="mt-3">Your stats:</v-subheader>

        <v-list dense>
          <v-list-item>
            <v-list-item-icon>
              <v-icon small class="ml-4">mdi-folder-multiple</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Total: {{ user.streams.totalCount }} streams</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          <v-list-item>
            <v-list-item-icon>
              <v-icon small class="ml-4">mdi-source-commit</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Total: {{ user.commits.totalCount }} commits</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>

        <div class="ml-5"></div>
      </div>
    </v-navigation-drawer>

    <v-app-bar app style="padding-left: 56px">
      <v-app-bar-nav-icon @click="streamNav = !streamNav" v-show="!streamNav"></v-app-bar-nav-icon>
      <v-toolbar-title class="space-grotesk">
        <v-icon>mdi-folder-multiple</v-icon>
        Streams
      </v-toolbar-title>
      <v-spacer v-if="!streamNav"></v-spacer>
      <v-toolbar-items v-if="!streamNav">
        <v-btn color="primary" @click="newStreamDialog = true">
          <v-icon>mdi-plus-box</v-icon>
        </v-btn>
      </v-toolbar-items>
    </v-app-bar>
    
    <server-invite-dialog ref="serverInviteDialog" />
    
    <v-dialog v-model="newStreamDialog" max-width="500">
      <stream-new-dialog
        v-if="streams && streams.items"
        :open="newStreamDialog"
        :redirect="streams.items.length > 0"
        @created="newStreamDialog = false"
      />
    </v-dialog>
    
    <!-- <getting-started-wizard /> -->
    
    <v-row class="px-4" no-gutters>
      <v-col cols="12">
        
      </v-col>
      <v-col v-if="$apollo.loading">
        <v-row>
          <v-col v-for="i in 6" :key="i" cols="12" sm="6" md="6" lg="4" xl="4">
            <v-skeleton-loader type="card, list-item-two-line" class="ma-2"></v-skeleton-loader>
          </v-col>
        </v-row>
        <div v-if="$apollo.loading" class="my-5"></div>
      </v-col>

      <v-col cols="12" v-else-if="streams && streams.items && streams.items.length > 0">
        <v-row>
          <v-col
            v-for="(stream, i) in streams.items"
            :key="i"
            cols="12" sm="6" md="6" lg="4" xl="4"
          >
            <list-item-stream :stream="stream"></list-item-stream>
          </v-col>
          <infinite-loading
            v-if="streams.items.length < streams.totalCount"
            @infinite="infiniteHandler"
          >
            <div slot="no-more">These are all your streams!</div>
            <div slot="no-results">There are no streams to load</div>
          </infinite-loading>
        </v-row>
      </v-col>
      <v-col v-else cols="12">
        <div class="ma-5 headline justify-center text-center">
          😿
          <br />
          Your don't have any streams!

          <br />
          <span class="subtitle-2 font-italic">
            Create one now with the big blue button to the side.
          </span>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
import ListItemStream from '../components/ListItemStream'
import StreamNewDialog from '../components/dialogs/StreamNewDialog'
import GettingStartedWizard from '../components/GettingStartedWizard'
import streamsQuery from '../graphql/streams.gql'
import userQuery from '../graphql/user.gql'
import InfiniteLoading from 'vue-infinite-loading'
import ServerInviteDialog from '../components/dialogs/ServerInviteDialog.vue'
import SearchBar from '../components/SearchBar'
import gql from 'graphql-tag'

export default {
  name: 'Streams',
  components: {
    ListItemStream,
    StreamNewDialog,
    InfiniteLoading,
    ServerInviteDialog,
    GettingStartedWizard,
    SearchBar
  },
  apollo: {
    streams: {
      prefetch: true,
      query: streamsQuery,
      fetchPolicy: 'cache-and-network' //https://www.apollographql.com/docs/react/data/queries/
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
        result() {
          this.$apollo.queries.streams.refetch()
        },
        skip() {
          return !this.loggedIn
        }
      },
      userStreamRemoved: {
        query: gql`
          subscription {
            userStreamRemoved
          }
        `,
        result() {
          this.$apollo.queries.streams.refetch()
        },
        skip() {
          return !this.loggedIn
        }
      }
    }
  },
  data: () => ({
    activeTab: 'streams',
    streams: [],
    newStreamDialog: false,
    streamNav: true
  }),
  computed: {
    recentActivity() {
      let activity = []

      if (this.streams && this.streams.items) {
        this.streams.items.forEach((x) =>
          x.commits.items.forEach((y) => {
            y.streamName = x.name
            y.streamId = x.id
            activity.push(y)
          })
        )
        activity.push(...this.streams.items)
      }

      activity.sort(this.compareUpdates)
      return activity
    },
    loggedIn() {
      return localStorage.getItem('uuid') !== null
    }
  },
  watch: {
    streams(val) {
      if (val.items.length === 0 && !localStorage.getItem('onboarding')) {
        this.$router.push('/onboarding')
      }
    }
  },
  methods: {
    showServerInviteDialog() {
      this.$refs.serverInviteDialog.show()
    },

    infiniteHandler($state) {
      this.$apollo.queries.streams.fetchMore({
        variables: {
          cursor: this.streams.cursor
        },
        // Transform the previous result with new data
        updateQuery: (previousResult, { fetchMoreResult }) => {
          const newItems = fetchMoreResult.streams.items

          //set vue-infinite state
          if (newItems.length === 0) $state.complete()
          else $state.loaded()

          return {
            streams: {
              __typename: previousResult.streams.__typename,
              totalCount: fetchMoreResult.streams.totalCount,
              cursor: fetchMoreResult.streams.cursor,
              // Merging the new streams
              items: [...previousResult.streams.items, ...newItems]
            }
          }
        }
      })
    },
    compareUpdates(a, b) {
      if (a.createdAt < b.createdAt) {
        return 1
      }
      if (a.createdAt > b.createdAt) {
        return -1
      }
      return 0
    }
  }
}
</script>
<style scoped>
.recent-commits a {
  color: inherit;
  text-decoration: none;
  font-weight: 500;
}

.recent-commits a:hover {
  text-decoration: underline;
}
</style>
