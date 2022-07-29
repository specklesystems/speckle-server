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
              {{ documentToBasicString(commentDetails.text.doc) }}
            </router-link>
          </div>
          <div class="text-truncate caption">
            <!-- <br /> -->
            <span v-if="commentDetails.replies.totalCount > 0">
              <!-- eslint-disable-next-line prettier/prettier -->
              Last reply
              <timeago :datetime="commentDetails.updatedAt" />
              <!--, on {{ new Date(commentDetails.updatedAt).toLocaleString() }} -->
              <br />
            </span>
            <span class="grey--text">
              Created on {{ new Date(commentDetails.createdAt).toLocaleString() }}
            </span>
            <br />
            <v-btn
              v-if="canArchiveThread"
              class="ml-n2 red--text rounded-lg elevation-0"
              x-small
              plain
              @click="showArchiveDialog = true"
            >
              Archive
            </v-btn>
            <v-dialog v-model="showArchiveDialog" max-width="500">
              <v-card>
                <v-toolbar color="error" dark flat>
                  <v-app-bar-nav-icon style="pointer-events: none">
                    <v-icon>mdi-pencil</v-icon>
                  </v-app-bar-nav-icon>
                  <v-toolbar-title>Archive Comment Thread</v-toolbar-title>
                  <v-spacer></v-spacer>
                  <v-btn icon @click="showArchiveDialog = false">
                    <v-icon>mdi-close</v-icon>
                  </v-btn>
                </v-toolbar>
                <v-card-text class="mt-4">
                  This comment thread will be archived. Are you sure?
                </v-card-text>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn text @click="showArchiveDialog = false">Cancel</v-btn>
                  <v-btn color="error" text @click="archiveComment()">Archive</v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
            <v-btn
              v-if="isUnread"
              class="ml-n2 rounded-lg elevation-0"
              x-small
              plain
              @click="markAsRead"
            >
              Mark as read
            </v-btn>
          </div>
        </div>
        <div class="body-2 px-4 flex-shrink-0">
          <span
            v-if="commentDetails.data && commentDetails.data.filters"
            v-tooltip="`This comment has a filter.`"
            class="mr-1"
          >
            <v-icon small>mdi-filter-variant</v-icon>
          </span>
          <span
            v-if="commentDetails.data && commentDetails.data.sectionBox"
            v-tooltip="`This comment has a section box.`"
            class="mr-1"
          >
            <v-icon small>mdi-cube-outline</v-icon>
          </span>

          <v-btn small class="ml-1 primary dark rounded-xl" :to="link">
            <v-icon small>mdi-comment-outline</v-icon>
            {{ commentDetails.replies.totalCount }}
            reply
          </v-btn>
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
import { gql } from '@apollo/client/core'
import { documentToBasicString } from '@/main/lib/common/text-editor/documentHelper'
import { COMMENT_FULL_INFO_FRAGMENT } from '@/graphql/comments'

// TODO: Stop polling each comment separately

export default {
  components: {
    UserAvatar: () => import('@/main/components/common/UserAvatar')
  },
  props: {
    comment: { type: Object, default: () => null },
    stream: {
      type: Object,
      default: () => {
        return { role: null }
      }
    }
  },
  apollo: {
    commentDetails: {
      query: gql`
        query ($streamId: String!, $id: String!) {
          comment(streamId: $streamId, id: $id) {
            ...CommentFullInfo
          }
        }
        ${COMMENT_FULL_INFO_FRAGMENT}
      `,
      fetchPolicy: 'no-cache',
      variables() {
        return {
          streamId: this.$route.params.streamId,
          id: this.comment.id
        }
      },
      update(data) {
        return data.comment
      },
      skip() {
        return !this.comment
      }
    },
    $subscribe: {
      commentThreadActivity: {
        query: gql`
          subscription ($streamId: String!, $commentId: String!) {
            commentThreadActivity(streamId: $streamId, commentId: $commentId) {
              type
            }
          }
        `,
        variables() {
          return {
            streamId: this.$route.params.streamId,
            commentId: this.comment.id
          }
        },
        skip() {
          return !this.$loggedIn()
        },
        result({ data }) {
          if (!data || !data.commentThreadActivity) return

          // Note: This kind of direct apollo result mutation is only allowed, because
          // of the 'no-cache' fetch policy, which means that there's no cache mutation actually happening
          if (data.commentThreadActivity.type === 'reply-added') {
            this.commentDetails.replies.totalCount++
            this.commentDetails.updatedAt = Date.now()
            return
          }
          if (data.commentThreadActivity.type === 'comment-archived') {
            this.$emit('deleted', this.comment)
          }
        }
      }
    }
  },
  data() {
    return {
      hovered: false,
      showArchiveDialog: false,
      documentToBasicString
    }
  },
  computed: {
    canArchiveThread() {
      if (!this.comment || !this.stream) return false
      if (!this.stream.role) return false
      if (
        this.comment.authorId === this.$userId() ||
        this.stream.role === 'stream:owner'
      )
        return true
      return false
    },
    link() {
      if (!this.commentDetails) return
      const res = this.commentDetails.resources.filter(
        (r) => r.resourceType !== 'stream'
      )
      const first = res.shift()
      let route = `/streams/${this.$route.params.streamId}/${first.resourceType}s/${first.resourceId}?cId=${this.commentDetails.id}`
      if (res.length !== 0) {
        route += `&overlay=${res.map((r) => r.resourceId).join(',')}`
      }
      return route
    },
    isUnread() {
      if (!this.commentDetails) return
      return (
        new Date(this.commentDetails.updatedAt) -
          new Date(this.commentDetails.viewedAt) >
        0
      )
    }
  },
  methods: {
    async markAsRead() {
      this.commentDetails.viewedAt = Date.now()
      await this.$apollo.mutate({
        mutation: gql`
          mutation commentView($streamId: String!, $commentId: String!) {
            commentView(streamId: $streamId, commentId: $commentId)
          }
        `,
        variables: {
          streamId: this.$route.params.streamId,
          commentId: this.comment.id
        }
      })
    },
    async archiveComment() {
      try {
        await this.$apollo.mutate({
          mutation: gql`
            mutation commentArchive($streamId: String!, $commentId: String!) {
              commentArchive(streamId: $streamId, commentId: $commentId)
            }
          `,
          variables: {
            streamId: this.$route.params.streamId,
            commentId: this.comment.id
          }
        })
        this.showArchiveDialog = false
        this.commentDetails.archived = true
        this.$emit('deleted', this.comment)
        this.$mixpanel.track('Comment Action', { type: 'action', name: 'archive' })
        this.$eventHub.$emit('notification', {
          text: 'Thread archived.'
        })
      } catch (e) {
        this.$eventHub.$emit('notification', {
          text: e.message
        })
      }
    }
  }
}
</script>
<style scoped>
.border {
  outline: 2px solid #047efb;
}
</style>
