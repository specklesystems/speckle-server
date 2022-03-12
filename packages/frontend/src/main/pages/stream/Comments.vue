<template>
  <div class="">
    <!-- <div class="">{{ localComments }}</div> -->
    <comment-list-item v-for="c in localComments" :key="c.id" :comment="c" />
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
      localComments: []
    }
  },
  apollo: {
    comments: {
      query: gql`
        query($streamId: String!, $resources: [ResourceIdentifierInput]!) {
          comments(streamId: $streamId, resources: $resources, limit: 10) {
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
