<template>
  <v-container :fluid="$vuetify.breakpoint.mdAndDown">
    <v-row>
      <v-col cols="12" sm="12" md="4" lg="3" xl="2">
        <div class="mt-5 mx-5">
          <div class="d-flex flex-column">
            <v-btn large rounded color="primary" class="mb-2" block @click="newStreamDialog = true">
              <v-icon small class="mr-1">mdi-plus-box</v-icon>
              new stream
            </v-btn>
            <v-btn large rounded outlined color="primary" block @click="showServerInviteDialog">
              <v-icon small class="mr-2">mdi-email-send</v-icon>
              Send an invite
            </v-btn>
          </div>
          <server-invite-dialog ref="serverInviteDialog" />
          <v-dialog v-model="newStreamDialog" max-width="500">
            <stream-new-dialog
              v-if="streams && streams.items"
              :open="newStreamDialog"
              :redirect="streams.items.length > 0"
              @created="newStreamDialog = false"
            />
          </v-dialog>
          <div v-if="user" class="my-5">
            <v-subheader class="mt-3">Your stats:</v-subheader>
            <div class="ml-5">
              <p>
                <v-icon small>mdi-compare-vertical</v-icon>
                <b>{{ user.streams.totalCount }}</b>
                streams
              </p>
              <p>
                <v-icon small>mdi-source-commit</v-icon>
                <b>{{ user.commits.totalCount }}</b>
                commits
              </p>
              <p v-if="user.commits.totalCount > 0">
                Last commit
                <b>
                  <timeago
                    :datetime="user.commits.items[0].createdAt"
                    class="font-italic ma-1"
                  ></timeago>
                </b>
              </p>
            </div>
          </div>
        </div>
      </v-col>
      <v-col cols="12" sm="12" md="8" lg="9" xl="10">
        <v-row>
          <v-col cols="12">
            <getting-started-wizard />
          </v-col>
          <v-col v-if="$apollo.loading">
            <v-row>
              <v-col v-for="i in 6" :key="i" cols="12" sm="12" md="12" lg="6" xl="4">
                <v-skeleton-loader type="card, list-item-two-line" class="ma-2"></v-skeleton-loader>
              </v-col>
            </v-row>
            <div v-if="$apollo.loading" class="my-5"></div>
          </v-col>

          <v-col v-else-if="streams && streams.items && streams.items.length > 0">
            <v-row>
              <v-col
                v-for="(stream, i) in streams.items"
                :key="i"
                cols="12"
                sm="12"
                md="12"
                lg="6"
                xl="4"
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
import gql from 'graphql-tag'

export default {
  name: 'Streams',
  components: {
    ListItemStream,
    StreamNewDialog,
    InfiniteLoading,
    ServerInviteDialog,
    GettingStartedWizard
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
    newStreamDialog: false
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
