<template>
  <v-card
    :class="`rounded-lg overflow-hidden ${hovered ? 'elevation-10' : ''} ${
      isUnread ? 'border' : ''
    } `"
    style="transition: box-shadow 0.3s ease"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
  >
    <div v-if="commentDetails" class="">
      <!-- <v-img :src="commentDetails.screenshot" max-width="150" max-height="150" /> -->
      <div class="d-flex align-center flex-grow-1 justify-space-between">
        <div class="mx-2">
          <user-avatar :id="commentDetails.authorId" :size="40" />
        </div>
        <div class="text-truncate body-1 mr-auto">
          <div class="text-truncate">
            <router-link class="text-decoration-none" :to="link">
              {{ commentDetails.text }}
            </router-link>
          </div>
          <div class="text-truncate caption">
            <!-- <br /> -->
            <span v-if="commentDetails.replies.totalCount > 0">
              <!-- eslint-disable-next-line prettier/prettier -->
              Last reply <timeago :datetime="commentDetails.updatedAt" /> <!--, on {{ new Date(commentDetails.updatedAt).toLocaleString() }} -->
              <br />
            </span>
            <span class="grey--text">
              Created on {{ new Date(commentDetails.createdAt).toLocaleString() }}
            </span>
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
          <span
            v-if="commentDetails.data.sectionBox"
            v-tooltip="`This comment has a section box.`"
            class="mr-1"
          >
            <v-icon small>mdi-cube-outline</v-icon>
          </span>
          <v-icon small>mdi-comment-outline</v-icon>
          {{ commentDetails.replies.totalCount }}
          <span v-show="!$vuetify.breakpoint.xs && false" class="">
            {{
              commentDetails.replies.totalCount > 1 || commentDetails.replies.totalCount === 0
                ? 'replies'
                : 'reply'
            }}
          </span>
          <v-btn small class="ml-1 primary dark rounded-xl" :to="link">reply</v-btn>
        </div>
        <div class="flex-shrink-0">
          <router-link class="text-decoration-none" :to="link">
            <v-img
              :src="commentDetails.screenshot"
              :width="`${$vuetify.breakpoint.xs ? '100' : '200'}`"
              height="140"
              :gradient="`to top right, ${
                $vuetify.theme.dark
                  ? 'rgba(100,115,201,.33), rgba(25,32,72,.7)'
                  : 'rgba(100,115,231,.1), rgba(25,32,72,.05)'
              }`"
            />
          </router-link>
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
            viewedAt
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
  },
  data() {
    return {
      hovered: false
    }
  },
  computed: {
    link() {
      if (!this.commentDetails) return
      let res = this.commentDetails.resources.filter((r) => r.resourceType !== 'stream')
      let first = res.shift()
      let route = `/streams/${this.$route.params.streamId}/${first.resourceType}s/${first.resourceId}?cId=${this.commentDetails.id}`
      if (res.length !== 0) {
        route += `&overlay=${res.map((r) => r.resourceId).join(',')}`
      }
      return route
    },
    isUnread() {
      if (!this.commentDetails) return
      return new Date(this.commentDetails.updatedAt) - new Date(this.commentDetails.viewedAt) > 0
    }
  }
}
</script>
<style scoped>
.border {
  outline: 2px solid #047efb;
}
</style>
