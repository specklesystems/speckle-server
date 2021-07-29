<template>
  <v-row>
    <v-col cols="12">
      <breadcrumb-title />
      <h3 class="title font-italic font-weight-thin my-5">Recent activity on this Stream</h3>
    </v-col>
    <v-col cols="12">
      <v-timeline v-if="stream" align-top :dense="$vuetify.breakpoint.mobile">
        <list-item-activity
          v-for="activity in stream.activity.items"
          :key="activity.time"
          :activity="activity"
          class="my-1"
        ></list-item-activity>
      </v-timeline>
      <v-timeline v-else-if="$apollo.loading" align-top :dense="$vuetify.breakpoint.mobile">
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
    BreadcrumbTitle: () => import('@/components/BreadcrumbTitle')
  },
  data() {
    return {}
  },
  apollo: {
    stream: {
      query: gql`
        query Stream($id: String!) {
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
            activity {
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
  }
}
</script>
