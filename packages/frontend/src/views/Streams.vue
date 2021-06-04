<template>
  <v-container :fluid="$vuetify.breakpoint.mdAndDown">
    <v-row>
      <v-col cols="12" sm="12" md="4" lg="3" xl="2">
        <v-card rounded="lg" class="mt-5 mx-5" elevation="0" color="background">
          <v-card-actions>
            <v-btn large rounded color="primary" block @click="newStreamDialog = true">
              <v-icon small class="mr-1">mdi-plus-box</v-icon>
              new stream
            </v-btn>
          </v-card-actions>
          <v-dialog v-model="newStreamDialog" max-width="500">
            <stream-new-dialog :open="newStreamDialog" />
          </v-dialog>
        </v-card>
        <div v-if="$apollo.loading" class="pa-3 mx-5 mt-5">
          <v-skeleton-loader type="list-item-three-line"></v-skeleton-loader>
        </div>
        <v-card
          v-else-if="recentActivity"
          rounded="lg"
          class="mx-5 mt-3 d-none d-md-block"
          elevation="0"
          color="background"
        >
          <v-card-title v-if="recentActivity.length > 0" class="subtitle-1 pb-0">
            Recent Activity
          </v-card-title>
          <v-list color="transparent" two-lines class="recent-commits">
            <div v-for="(a, i) in recentActivity" :key="i">
              <v-list-item v-if="a.__typename === 'Commit'">
                <v-list-item-avatar size="30" class="mr-2">
                  <user-avatar
                    :id="a.authorId"
                    :avatar="a.authorAvatar"
                    :size="30"
                    :name="a.authorName"
                  />
                </v-list-item-avatar>
                <v-list-item-content>
                  <v-list-item-title class="subtitle-2">
                    <router-link
                      :to="
                        a.branchName.startsWith('globals')
                          ? `streams/${a.streamId}/${a.branchName}/${a.id}`
                          : `streams/${a.streamId}/commits/${a.id}`
                      "
                    >
                      {{ a.message }}
                    </router-link>
                  </v-list-item-title>
                  <v-list-item-subtitle class="caption">
                    <i>
                      Sent to
                      <router-link :to="'streams/' + a.streamId">
                        {{ a.streamName }}
                      </router-link>
                    </i>
                  </v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>

              <v-list-item v-if="a.__typename === 'Stream'">
                <v-list-item-content>
                  <v-list-item-title class="subtitle-2">
                    <router-link :to="'streams/' + a.id">
                      {{ a.name }}
                    </router-link>
                  </v-list-item-title>
                  <v-list-item-subtitle class="caption">
                    <i>A new stream was created</i>
                  </v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
              <v-divider />
            </div>
          </v-list>
          <v-btn small plain color="primary" text class="d-block" @click="showServerInviteDialog">
            <v-icon small class="mr-2">mdi-email-send-outline</v-icon>
            Send an invite
          </v-btn>
          <server-invite-dialog ref="serverInviteDialog" />
        </v-card>
      </v-col>
      <v-col cols="12" sm="12" md="8" lg="9" xl="10">
        <div v-if="!$apollo.loading && streams.totalCount === 0" class="pa-4">
          <no-data-placeholder
            :message="`Hello there! It seems like you don't have any streams yet. Here's a handful of useful links to help you get started:`"
          />
        </div>
        <v-card v-if="user && user.streams.totalCount > 0" class="my-5" flat>
          <v-card-text class="body-1">
            <span>
              You have
              <v-icon small>mdi-compare-vertical</v-icon>
              <b>{{ user.streams.totalCount }}</b>
              streams and
              <v-icon small>mdi-source-commit</v-icon>
              <b>{{ user.commits.totalCount }}</b>
              commits.
            </span>
          </v-card-text>
        </v-card>
        <v-card elevation="0" color="transparent">
          <div v-if="$apollo.loading" class="my-5">
            <v-skeleton-loader type="list-item-three-line"></v-skeleton-loader>
          </div>
        </v-card>
        <v-row v-if="streams && streams.items">
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
    </v-row>
  </v-container>
</template>
<script>
import ListItemStream from '../components/ListItemStream'
import StreamNewDialog from '../components/dialogs/StreamNewDialog'
import NoDataPlaceholder from '../components/NoDataPlaceholder'
import UserAvatar from '../components/UserAvatar'
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
    UserAvatar,
    NoDataPlaceholder,
    ServerInviteDialog
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
    },
    showServerInviteDialog() {
      this.$refs.serverInviteDialog.show()
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
