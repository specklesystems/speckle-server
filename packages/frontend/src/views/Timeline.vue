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

        <v-list
          v-if="streams && streams.items.length > 0"
          color="transparent"
          class="recent-streams ml-3"
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
          <v-col v-if="$apollo.loading">
            <v-card elevation="0" color="transparent">
              <div v-if="$apollo.loading" class="my-5">
                <v-skeleton-loader type="list-item-three-line"></v-skeleton-loader>
              </div>
            </v-card>
          </v-col>

          <v-col v-else>
            <div>
              <v-subheader class="mb-3">Recent activity</v-subheader>
              <div v-if="timeline" key="activity-list">
                <list-item-activity
                  v-for="activity in timeline.items"
                  :key="activity.time"
                  :activity="activity"
                  class="my-1"
                ></list-item-activity>
                <infinite-loading
                  v-if="timeline.items.length < timeline.totalCount"
                  @infinite="infiniteHandler"
                >
                  <div slot="no-more">This is all your activity!</div>
                  <div slot="no-results">There are no ctivities to load</div>
                </infinite-loading>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import ListItemActivity from '@/components/ListItemActivity'
import ServerInviteDialog from '@/components/dialogs/ServerInviteDialog.vue'
import StreamNewDialog from '@/components/dialogs/StreamNewDialog'
import gql from 'graphql-tag'
import InfiniteLoading from 'vue-infinite-loading'

export default {
  name: 'Timeline',
  components: { ListItemActivity, InfiniteLoading, ServerInviteDialog, StreamNewDialog },
  props: {
    type: String
  },
  data() {
    return {
      newStreamDialog: false,
      filterTypes: [
        'branch_create',
        'branch_delete',
        'branch_update',
        'stream_create',
        'stream_delete',
        'stream_update',
        'stream_permissions_add',
        'stream_permissions_remove',
        'commit_create',
        'commit_delete',
        'commit_udpate',
        'user_update',
        'user_create',
        'user_delete'
      ],
      activityFilter: {
        type: null,
        before: null,
        after: null
      },
      menu: false,
      menu2: false,
      load: false,
      showContent: false
    }
  },
  computed: {
    filterSelect() {
      return this.filterTypes.map((t) => {
        var split = t.split('_')
        var name = `${split[0]} ${split[1]}`
        return {
          type: t,
          name: name
        }
      })
    }
  },
  mounted() {},
  apollo: {
    timeline: {
      query: gql`
        query {
          user {
            id
            timeline {
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
      },
      fetchPolicy: 'cache-and-network'
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
      `,
      fetchPolicy: 'cache-and-network' //https://www.apollographql.com/docs/react/data/queries/
    }
  },

  methods: {
    showServerInviteDialog() {
      this.$refs.serverInviteDialog.show()
    },
    infiniteHandler($state) {
      this.$apollo.queries.timeline.fetchMore({
        variables: {
          cursor: this.timeline.cursor
        },
        // Transform the previous result with new data
        updateQuery: (previousResult, { fetchMoreResult }) => {
          const newItems = fetchMoreResult.timeline.items

          //set vue-infinite state
          if (newItems.length === 0) $state.complete()
          else $state.loaded()

          return {
            timeline: {
              __typename: previousResult.timeline.__typename,
              totalCount: fetchMoreResult.timeline.totalCount,
              cursor: fetchMoreResult.timeline.cursor,
              // Merging the new timeline
              items: [...previousResult.timeline.items, ...newItems]
            }
          }
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
