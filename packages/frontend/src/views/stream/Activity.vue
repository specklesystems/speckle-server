<template>
  <v-row>
    <v-col cols="12">
      <v-timeline v-if="stream && groupedActivity && groupedActivity.length !== 0" align-top dense>
        <list-item-activity
          v-for="activity in groupedActivity"
          :key="activity.time"
          :activity="activity"
          :activity-group="activity"
          class="my-1"
        ></list-item-activity>
        <infinite-loading
          v-if="stream.activity && stream.activity.items.length < stream.activity.totalCount"
          @infinite="infiniteHandler"
        >
          <div slot="no-more">This is all your activity!</div>
          <div slot="no-results">There are no ctivities to load</div>
        </infinite-loading>
      </v-timeline>
      <v-timeline v-else-if="$apollo.loading" align-top dense>
        <v-timeline-item v-for="i in 6" :key="i" medium>
          <v-skeleton-loader type="article"></v-skeleton-loader>
        </v-timeline-item>
      </v-timeline>
      <div v-if="groupedActivity && groupedActivity.length === 0">
        <v-card class="transparent elevation-0 mt-10">
          <v-card-text>Nothing to show 🍃</v-card-text>
        </v-card>
      </div>
    </v-col>
  </v-row>
</template>
<script>
import gql from 'graphql-tag'

export default {
  name: 'Activity',
  components: {
    ListItemActivity: () => import('@/components/ListItemActivity'),
    InfiniteLoading: () => import('vue-infinite-loading')
  },
  data() {
    return { groupedActivity: null }
  },
  apollo: {
    stream: {
      query: gql`
        query Stream($id: String!, $cursor: DateTime) {
          stream(id: $id) {
            id
            name
            createdAt
            commits {
              totalCount
            }
            branches {
              totalCount
            }
            activity(cursor: $cursor) {
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
      variables() {
        return {
          id: this.$route.params.streamId
        }
      },
      result({ data }) {
        this.groupSimilarActivities(data)
      }
    }
  },
  methods: {
    groupSimilarActivities(data) {
      let groupedActivity = data.stream.activity.items.reduce(function (prev, curr) {
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
      this.groupedActivity = groupedActivity
    },
    infiniteHandler($state) {
      this.$apollo.queries.stream.fetchMore({
        variables: {
          cursor: this.stream.activity.cursor
        },
        // Transform the previous result with new data
        updateQuery: (previousResult, { fetchMoreResult }) => {
          const newItems = fetchMoreResult.stream.activity.items

          //set vue-infinite state
          if (newItems.length === 0) $state.complete()
          else $state.loaded()

          fetchMoreResult.stream.activity.items = [
            ...previousResult.stream.activity.items,
            ...newItems
          ]

          return fetchMoreResult
        }
      })
    }
  }
}
</script>
