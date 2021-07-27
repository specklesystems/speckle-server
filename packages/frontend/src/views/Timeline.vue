<template>
  <v-container :fluid="$vuetify.breakpoint.mdAndDown">
    <v-row>
      <v-col cols="12" sm="12" md="4" lg="3" xl="2">
        <!-- <v-card rounded="lg" class="mt-5 mx-5" elevation="0" color="background">
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
              :open="newStreamDialog"
              :redirect="streams.items.length > 0"
              @created="newStreamDialog = false"
            />
          </v-dialog>
        </v-card> -->
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
              <!-- <v-card elevation="0" class="my-5" flat>
                <v-card-text class="pb-0">
                  <span>Filter activity feed</span>
                  <div class="d-flex">
                    <v-select
                      v-model="activityFilter.type"
                      :items="filterSelect"
                      item-text="name"
                      item-value="type"
                      label="Activity type"
                      dense
                      clearable
                    ></v-select>
                    <v-menu
                      ref="menub"
                      v-model="menu2"
                      :close-on-content-click="true"
                      transition="scale-transition"
                      offset-y
                      min-width="auto"
                    >
                      <template #activator="{ on, attrs }">
                        <v-text-field
                          v-model="activityFilter.after"
                          label="After date"
                          prepend-icon="mdi-calendar"
                          readonly
                          v-bind="attrs"
                          dense
                          clearable
                          v-on="on"
                        ></v-text-field>
                      </template>
                      <v-date-picker
                        v-model="activityFilter.after"
                        no-title
                        color="primary"
                      ></v-date-picker>
                    </v-menu>
                    <v-menu
                      ref="menu"
                      v-model="menu"
                      :close-on-content-click="true"
                      transition="scale-transition"
                      offset-y
                      min-width="auto"
                    >
                      <template #activator="{ on, attrs }">
                        <v-text-field
                          v-model="activityFilter.before"
                          label="Before date"
                          prepend-icon="mdi-calendar"
                          readonly
                          v-bind="attrs"
                          dense
                          clearable
                          v-on="on"
                        ></v-text-field>
                      </template>
                      <v-date-picker
                        v-model="activityFilter.before"
                        no-title
                        color="primary"
                        @cancel="activityFilter.before = null"
                      ></v-date-picker>
                    </v-menu>
                  </div>
                </v-card-text>
              </v-card> -->
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
import gql from 'graphql-tag'
import InfiniteLoading from 'vue-infinite-loading'

export default {
  name: 'Timeline',
  components: { ListItemActivity, InfiniteLoading },
  props: {
    type: String
  },
  data() {
    return {
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
      }
    }
  },

  methods: {
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

<style scoped></style>
