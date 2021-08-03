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
              v-if="streams"
              :open="newStreamDialog"
              :redirect="streams.items.length > 0"
              @created="newStreamDialog = false"
            />
          </v-dialog>
        </div>
        <div v-if="$apollo.queries.streams.loading" class="my-5">
          <v-skeleton-loader type="list-item-two-line@3"></v-skeleton-loader>
        </div>

        <v-list
          v-if="streams && streams.items.length > 0"
          color="transparent"
          class="recent-streams ml-3 hidden-sm-and-down"
          two-lines
        >
          <v-subheader class="mt-3">Recent streams</v-subheader>
          <div v-for="(s, i) in streams.items" :key="i">
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title class="subtitle-1">
                  <router-link :to="'streams/' + s.id">
                    {{ s.name }}
                  </router-link>
                </v-list-item-title>
                <v-list-item-subtitle class="caption">
                  <i>
                    Updated
                    <timeago :datetime="s.updatedAt"></timeago>
                  </i>
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </div>
        </v-list>
        <p></p>
      </v-col>
      <v-col cols="12" sm="12" md="8" lg="9" xl="10">
        <v-row>
          <v-col cols="12">
            <getting-started-wizard />
          </v-col>
          <v-col v-if="$apollo.loading && !timeline">
            <div class="my-5">
              <v-timeline align-top dense>
                <v-timeline-item v-for="i in 6" :key="i" medium>
                  <v-skeleton-loader type="article"></v-skeleton-loader>
                </v-timeline-item>
              </v-timeline>
            </div>
          </v-col>

          <v-col v-else-if="timeline && timeline.items.length > 0">
            <div>
              <v-subheader class="mb-3">Recent activity</v-subheader>
              <div v-if="timeline" key="activity-list">
                <v-timeline align-top dense>
                  <list-item-activity
                    v-for="activity in timeline.items"
                    :key="activity.time"
                    :activity="activity"
                    class="my-1"
                  ></list-item-activity>
                  <infinite-loading
                    v-if="timeline && timeline.items.length < timeline.totalCount"
                    @infinite="infiniteHandler"
                  >
                    <div slot="no-more">This is all your activity!</div>
                    <div slot="no-results">There are no ctivities to load</div>
                  </infinite-loading>
                </v-timeline>
              </div>
            </div>
          </v-col>
          <v-col v-else cols="12">
            <div class="ma-5 headline justify-center text-center">
              🎈
              <br />
              Your feed is empty!

              <br />
              <span class="subtitle-2 font-italic">
                Try creating a stream, sending data etc and your activity willshow up here.
              </span>
            </div>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import ListItemActivity from '@/components/ListItemActivity'
import GettingStartedWizard from '../components/GettingStartedWizard'
import ServerInviteDialog from '@/components/dialogs/ServerInviteDialog.vue'
import StreamNewDialog from '@/components/dialogs/StreamNewDialog'
import gql from 'graphql-tag'
import InfiniteLoading from 'vue-infinite-loading'

export default {
  name: 'Timeline',
  components: {
    ListItemActivity,
    InfiniteLoading,
    ServerInviteDialog,
    StreamNewDialog,
    GettingStartedWizard
  },
  props: {
    type: String
  },
  data() {
    return {
      newStreamDialog: false
    }
  },
  computed: {},
  mounted() {},
  apollo: {
    timeline: {
      query: gql`
        query($before: DateTime) {
          user {
            id
            timeline(before: $before) {
              totalCount
              cursor
              items {
                actionType
                userId
                streamId
                resourceId
                resourceType
                time
                info
              }
            }
          }
        }
      `,
      update: (data) => {
        return data.user.timeline
      }
    },
    streams: {
      prefetch: true,
      query: gql`
        query {
          streams {
            items {
              id
              name
              updatedAt
            }
          }
        }
      `
    }
  },

  methods: {
    showServerInviteDialog() {
      this.$refs.serverInviteDialog.show()
    },
    infiniteHandler($state) {
      this.$apollo.queries.timeline.fetchMore({
        variables: {
          before: this.timeline.cursor
        },
        // Transform the previous result with new data
        updateQuery: (previousResult, { fetchMoreResult }) => {
          const newItems = fetchMoreResult.user.timeline.items

          //set vue-infinite state
          if (newItems.length === 0) $state.complete()
          else $state.loaded()

          fetchMoreResult.user.timeline.items = [...previousResult.user.timeline.items, ...newItems]

          return fetchMoreResult
        }
      })
    }
  }
}
</script>

<style>
.recent-streams a {
  text-decoration: none;
}

.recent-streams .v-list-item__title {
  font-family: 'Space Grotesk' !important;
}

/* .recent-streams a:hover {
  text-decoration: underline;
} */
</style>
