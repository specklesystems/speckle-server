<template>
  <v-row>
    <v-col cols="12">
      <breadcrumb-title />
      <h3 class="title font-italic font-weight-thin my-5">Recent activity on this Stream</h3>
    </v-col>
    <v-col cols="12">
      <v-timeline v-if="stream" align-top dense>
        <list-item-activity
          v-for="activity in stream.activity.items"
          :key="activity.time"
          :activity="activity"
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
    </v-col>
  </v-row>
</template>
<script>
import gql from 'graphql-tag'

export default {
  name: 'Activity',
  components: {
    ListItemActivity: () => import('@/components/ListItemActivity'),
    BreadcrumbTitle: () => import('@/components/BreadcrumbTitle'),
    InfiniteLoading: () => import('vue-infinite-loading')
  },
  data() {
    return {}
  },
  apollo: {
    stream: {
      query: gql`
        query Stream($id: String!, $before: DateTime) {
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
            activity(before: $before) {
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
      variables() {
        return {
          id: this.$route.params.streamId
        }
      }
    }
  },
  methods: {
    infiniteHandler($state) {
      this.$apollo.queries.stream.fetchMore({
        variables: {
          before: this.stream.activity.cursor
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
