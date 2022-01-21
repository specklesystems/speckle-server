<template>
  <v-container fluid>
    <portal to="title">
      <div class="font-weight-bold">Feed</div>
    </portal>
    <v-row class="pr-4">
      <v-col v-if="$apollo.loading && !timeline">
        <div class="my-5">
          <v-timeline align-top dense>
            <v-timeline-item v-for="i in 6" :key="i" medium>
              <v-skeleton-loader type="article"></v-skeleton-loader>
            </v-timeline-item>
          </v-timeline>
        </div>
      </v-col>

      <v-col
        v-else-if="timeline && timeline.items.length > 0"
        cols="12"
        lg="8"
        class="pr-2"
        :style="`${$vuetify.breakpoint.xsOnly ? 'margin-left: -20px;' : ''}`"
      >
        <div>
          <div v-if="timeline" key="activity-list">
            <v-timeline align-top dense>
              <list-item-activity
                v-for="activity in groupedTimeline"
                :key="activity.time"
                :activity="activity"
                :activity-group="activity"
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
        <no-data-placeholder v-if="quickUser">
          <h2>Welcome {{ quickUser.name.split(' ')[0] }}!</h2>
          <p class="caption">
            Once you will create a stream and start sending some data, your activity will show up
            here.
          </p>

          <template #actions>
            <v-list rounded class="transparent">
              <v-list-item
                link
                class="primary mb-4"
                dark
                @click="$eventHub.$emit('show-new-stream-dialog')"
              >
                <v-list-item-icon>
                  <v-icon>mdi-plus-box</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>Create a new stream!</v-list-item-title>
                  <v-list-item-subtitle class="caption">
                    Streams are like folders, or data repositories.
                  </v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </template>
        </no-data-placeholder>
      </v-col>

      <v-col
        v-show="$vuetify.breakpoint.lgAndUp"
        v-if="timeline && timeline.items.length > 0"
        cols="12"
        lg="4"
        class="mt-7"
        style="position: sticky; top: 64px"
      >
        <div class="sticky-top">
          <latest-blogposts></latest-blogposts>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import gql from 'graphql-tag'

export default {
  name: 'Timeline',
  components: {
    InfiniteLoading: () => import('vue-infinite-loading'),
    ListItemActivity: () => import('@/components/ListItemActivity'),
    LatestBlogposts: () => import('@/components/LatestBlogposts'),
    NoDataPlaceholder: () => import('@/components/NoDataPlaceholder')
  },
  props: {
    type: String
  },
  data() {
    return {
      newStreamDialog: 0,
      activityNav: true
    }
  },
  apollo: {
    quickUser: {
      query: gql`
        query {
          quickUser: user {
            id
            name
          }
        }
      `
    },
    timeline: {
      query: gql`
        query($cursor: DateTime) {
          user {
            id
            timeline(cursor: $cursor) {
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
                message
              }
            }
          }
        }
      `,
      fetchPolicy: 'cache-and-network',
      update(data) {
        return data.user.timeline
      },
      result({ data }) {
        this.groupSimilarActivities(data)
      }
    },
    streams: {
      prefetch: true,
      query: gql`
        query {
          streams(limit: 10) {
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
  computed: {},
  watch: {
    timeline(val) {
      if (val.totalCount === 0 && !localStorage.getItem('onboarding')) {
        this.$router.push('/onboarding')
      }
    }
  },
  mounted() {
    setTimeout(
      function () {
        this.activityNav = !this.$vuetify.breakpoint.smAndDown
      }.bind(this),
      10
    )
  },
  methods: {
    groupSimilarActivities(data) {
      if (!data) return
      let groupedTimeline = data.user.timeline.items.reduce(function (prev, curr) {
        //first item
        if (!prev.length) {
          prev.push([curr])
          return prev
        }
        let test = prev[prev.length - 1][0]
        let action = 'split' // split | combine | skip
        if (curr.actionType === test.actionType && curr.streamId === test.streamId) {
          if (curr.actionType.includes('stream_permissions')) {
            //skip multiple stream_permission actions on the same user, just pick the last!
            if (prev[prev.length - 1].some((x) => x.info.targetUser === curr.info.targetUser))
              action = 'skip'
            else action = 'combine'
          } //stream, branch, commit
          else if (curr.actionType.includes('_update') || curr.actionType === 'commit_create')
            action = 'combine'
        }
        if (action === 'combine') {
          prev[prev.length - 1].push(curr)
        } else if (action === 'split') {
          prev.push([curr])
        }
        return prev
      }, [])
      // console.log(groupedTimeline)
      this.groupedTimeline = groupedTimeline
    },

    infiniteHandler($state) {
      this.$apollo.queries.timeline.fetchMore({
        variables: {
          cursor: this.timeline.cursor
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
.sticky-top {
  position: sticky;
  top: 68px;
}
.recent-streams a {
  text-decoration: none;
}

.recent-streams .v-list-item__title {
  font-family: 'Space Grotesk' !important;
}
</style>
