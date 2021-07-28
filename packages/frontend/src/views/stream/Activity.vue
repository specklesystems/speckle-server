<template>
  <v-row>
    <v-col v-if="stream" cols="12">
      <breadcrumb-title />
    </v-col>
    <v-col cols="12">
      <v-timeline v-if="stream" align-top>
        <list-item-activity
          v-for="activity in stream.activity.items"
          :key="activity.time"
          :activity="activity"
          class="my-1"
        ></list-item-activity>
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
