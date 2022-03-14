<template>
  <div class="">
    <portal to="toolbar">
      <div v-if="!$apollo.loading" class="d-flex align-center">
        <div class="text-truncate flex-shrink-1">
          <router-link
            v-tooltip="stream.name"
            class="text-decoration-none space-grotesk mx-1"
            :to="`/streams/${stream.id}`"
          >
            <v-icon small class="primary--text mb-1 mr-1">mdi-folder</v-icon>
            <b class="d-none d-sm-inline">{{ stream.name }}</b>
          </router-link>
          /
        </div>
        <div class="text-truncate flex-shrink-0 mx-2">
          <v-icon small class="mr-1" style="font-size: 13px">mdi-comment-outline</v-icon>
          Comments
          <span class="caption">{{ localComments.length }}</span>
        </div>

        <!-- <div class="d-md-inline-block">
          <v-btn-toggle tile color="primary" group mandatory>
            <v-btn small icon disabled><v-icon small>mdi-filter</v-icon></v-btn>
            <v-btn small text @click="showArchivedComments = false">Active</v-btn>
            <v-btn small text @click="showArchivedComments = true">Archived</v-btn>
          </v-btn-toggle>
        </div> -->
      </div>
    </portal>
    <v-row dense>
      <v-col cols="12">
        <p class="caption">
          Webhooks allow you to subscribe to a stream's events and get notified of them in real
          time. You can then use this to trigger ci apps, automation workflows, and more.
        </p>
      </v-col>
      <v-col v-for="c in localComments" :key="c.id" cols="12" sm="6">
        <comment-list-item :comment="c" />
      </v-col>
    </v-row>
    <!-- TODO: infinite loading -->
  </div>
</template>
<script>
import gql from 'graphql-tag'

export default {
  name: 'Branch',
  components: {
    CommentListItem: () => import('@/main/components/comments/CommentListItem.vue')
  },
  data() {
    return {
      localComments: [],
      showArchivedComments: false,
      commentFilter: 1
    }
  },
  apollo: {
    stream: {
      query: gql`
        query Stream($id: String!) {
          stream(id: $id) {
            id
            name
          }
        }
      `,
      variables() {
        return { id: this.$route.params.streamId }
      }
    },
    comments: {
      query: gql`
        query($streamId: String!, $resources: [ResourceIdentifierInput]!, $archived: Boolean!) {
          comments(streamId: $streamId, resources: $resources, limit: 10, archived: $archived) {
            totalCount
            cursor
            items {
              id
            }
          }
        }
      `,
      variables() {
        return {
          streamId: this.$route.params.streamId,
          archived: this.showArchivedComments,
          resources: [
            {
              resourceType: 'stream',
              resourceId: this.$route.params.streamId
            }
          ]
        }
      },
      result({ data }) {
        for (let c of data.comments.items) {
          if (this.localComments.findIndex((lc) => c.id === lc.id) === -1)
            this.localComments.push({ ...c })
        }
      }
    }
    // $subscribe: {
    //   commentActivity: {
    //     query: gql`
    //       subscription($streamId: String!, $resourceId: String!) {
    //         commentActivity(streamId: $streamId, resourceId: $resourceId)
    //       }
    //     `,
    //     variables() {
    //       return {
    //         streamId: this.$route.params.streamId,
    //         resourceId: this.$route.params.resourceId
    //       }
    //     },
    //     skip() {
    //       return !this.$loggedIn() || !this.$route.params.resourceId
    //     },
    //     result({ data }) {
    //       if (!data.commentActivity) return
    //       // Creation
    //       if (data.commentActivity.eventType === 'comment-added') {
    //         data.commentActivity.expanded = false
    //         data.commentActivity.hovered = false
    //         data.commentActivity.bouncing = false
    //         this.localComments.push(data.commentActivity)
    //         setTimeout(() => {
    //           this.updateCommentBubbles()
    //           this.bounceComment(data.commentActivity.id)
    //         }, 10)
    //       }
    //     }
    //   }
    // }
  },
  methods: {}
}
</script>
<style scoped></style>
