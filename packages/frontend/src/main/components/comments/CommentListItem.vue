<template>
  <v-card class="my-4 rounded-lg overflow-hidden">
    <div v-if="commentDetails" class="">
      <!-- <v-img :src="commentDetails.screenshot" max-width="150" max-height="150" /> -->
      <div class="d-flex align-center flex-grow-1 justify-space-between">
        <div class="mx-2">
          <user-avatar :id="commentDetails.authorId" :size="40" />
        </div>
        <div class="text-truncate body-1 mr-auto">
          <div class="text-truncate">{{ commentDetails.text }}</div>
          <div class="text-truncate caption">
            <timeago :datetime="commentDetails.createdAt" />
            , on {{ new Date(commentDetails.createdAt).toLocaleString() }}
          </div>
        </div>
        <div class="body-2 px-4 flex-shrink-0">
          <span
            v-if="commentDetails.data.filters"
            v-tooltip="`This comment has a filter.`"
            class="mr-1"
          >
            <v-icon small>mdi-filter-variant</v-icon>
          </span>
          <span v-if="commentDetails.data.sectionBox" v-tooltip="`This comment has a section box.`">
            <v-icon small>mdi-cube-outline</v-icon>
          </span>
        </div>
        <div class="body-2 px-4 flex-shrink-0">
          <v-icon small>mdi-comment-outline</v-icon>
          {{ commentDetails.replies.totalCount }}
          {{
            commentDetails.replies.totalCount > 1 || commentDetails.replies.totalCount === 0
              ? 'replies'
              : 'reply'
          }}
        </div>
        <div class="flex-shrink-0">
          <v-img
            :src="commentDetails.screenshot"
            max-width="200"
            max-height="140"
            :gradient="`to top right, ${
              $vuetify.theme.dark
                ? 'rgba(100,115,201,.33), rgba(25,32,72,.7)'
                : 'rgba(100,115,231,.1), rgba(25,32,72,.05)'
            }`"
          />
        </div>
      </div>
    </div>
  </v-card>
</template>
<script>
import gql from 'graphql-tag'

export default {
  components: {
    UserAvatar: () => import('@/main/components/common/UserAvatar')
  },
  props: {
    comment: { type: Object, default: () => null }
  },
  apollo: {
    commentDetails: {
      query: gql`
        query($streamId: String!, $id: String!) {
          comment(streamId: $streamId, id: $id) {
            id
            text
            authorId
            screenshot
            createdAt
            updatedAt
            resources {
              resourceType
              resourceId
            }
            data
            replies {
              totalCount
            }
          }
        }
      `,
      variables() {
        return {
          streamId: this.$route.params.streamId,
          id: this.comment.id
        }
      },
      update(data) {
        return data.comment
      }
    }
  }
}
</script>
