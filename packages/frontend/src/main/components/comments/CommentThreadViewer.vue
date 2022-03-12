<template>
  <div
    class="mt-2 px-2 py-4"
    :style="`${$vuetify.breakpoint.xs ? 'width: 90vw;' : 'width: 300px;'}`"
  >
    <div v-if="$vuetify.breakpoint.xs" class="text-right mb-5">
      <!-- <v-btn
        v-if="$vuetify.breakpoint.xs"
        icon
        class="background ml-2 elevation-10"
        @click="minimise = !minimise"
      >
        <v-icon>mdi-minus</v-icon>
      </v-btn> -->
      <v-btn icon class="primary dark ml-2 elevation-10" @click="$emit('close', comment)">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </div>
    <div v-show="!minimise" style="width: 100%">
      <template v-for="(reply, index) in thread">
        <div v-if="showTime(index)" :key="index + 'date'" class="d-flex justify-center mouse">
          <div class="d-inline px-2 py-0 caption text-center mb-2 rounded-lg background grey--text">
            {{ new Date(reply.createdAt).toLocaleString() }}
            <timeago :datetime="reply.createdAt" class="font-italic ma-1"></timeago>
          </div>
        </div>
        <div
          :key="index"
          :class="`d-flex px-2 py-1 mb-2 align-center rounded-xl elevation-2 ${
            $userId() === reply.authorId ? 'primary white--text' : 'background'
          }`"
        >
          <div :class="`${$userId() === reply.authorId ? 'order-last' : ''}`">
            <user-avatar :id="reply.authorId" :size="30" />
          </div>
          <div :class="`mx-2 px-4 py-2 flex-grow-1 float-left caption`">
            {{ reply.text }}
          </div>
        </div>
      </template>
      <div class="px-0 mb-4">
        <v-textarea
          v-model="replyText"
          solo
          hide-details
          auto-grow
          rows="1"
          placeholder="Reply (shift + enter to send)"
          class="rounded-xl mb-2 caption"
          append-icon="mdi-send"
          @click:append="addReply"
          @keydown.enter.shift.exact.prevent="addReply()"
        ></v-textarea>
        <v-btn
          v-tooltip="'Marks this thread as archived.'"
          class="float-right"
          x-small
          rounded
          depressed
          color="error"
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
              <v-btn icon @click="showArchiveDialog = false"><v-icon>mdi-close</v-icon></v-btn>
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
      </div>
    </div>
  </div>
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
    replyQuery: {
      query: gql`
        query($streamId: String!, $id: String!) {
          comment(streamId: $streamId, id: $id) {
            id
            replies(limit: 1000) {
              totalCount
              cursor
              items {
                id
                text
                authorId
                createdAt
              }
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
      // skip() {
      //   return !this.comment.expanded
      // },
      result({ data }) {
        data.comment.replies.items.forEach((item) => {
          if (this.localReplies.findIndex((c) => c.id === item.id) === -1)
            this.localReplies.push(item)
        })
        // this.localReplies.push(...data.comment.replies.items)
      },
      update: (data) => data.comment
    },
    $subscribe: {
      commentReplyCreated: {
        query: gql`
          subscription($streamId: String!, $commentId: String!) {
            commentReplyCreated(streamId: $streamId, commentId: $commentId)
          }
        `,
        variables() {
          return {
            streamId: this.$route.params.streamId,
            commentId: this.comment.id
          }
        },
        // skip() {
        //   return !this.comment.expanded
        // },
        result({ data }) {
          if (!this.comment.expanded) return this.$emit('bounce', this.comment.id)
          else {
            setTimeout(() => {
              this.$emit('refresh-layout') // needed for layout reshuffle in parent
            }, 100)
          }
          this.localReplies.push({ ...data.commentReplyCreated })
        }
      }
    }
  },
  data: function () {
    return {
      replyText: null,
      localReplies: [],
      minimise: false,
      showArchiveDialog: false
    }
  },
  computed: {
    thread() {
      // TODO: add the replies in here too
      return [this.comment, ...this.localReplies]
    }
  },
  watch: {
    'comment.expanded': {
      deep: true,
      handler(newVal, oldVal) {
        if (!newVal) return
        this.localReplies = []
        this.$apollo.queries.replyQuery.refetch()
      }
    }
  },
  methods: {
    showTime(index) {
      if (index === 0) return true
      let curr = new Date(this.thread[index].createdAt)
      let prev = new Date(this.thread[index - 1].createdAt)
      let delta = Math.abs(prev - curr)
      return delta > 450000
    },
    async addReply() {
      if (!this.replyText || this.replyText.length < 3) {
        this.$eventHub.$emit('notification', {
          text: `Reply must be at least 3 characters.`
        })
        return
      }

      let replyInput = {
        streamId: this.$route.params.streamId,
        parentComment: this.comment.id,
        text: this.replyText
      }

      try {
        await this.$apollo.mutate({
          mutation: gql`
            mutation commentReply($input: ReplyCreateInput!) {
              commentReply(input: $input)
            }
          `,
          variables: { input: replyInput }
        })
        this.replyText = null
      } catch (e) {
        this.$eventHub.$emit('notification', {
          text: e.message
        })
      }

      setTimeout(() => {
        this.$emit('refresh-layout') // needed for layout reshuffle in parent
      }, 100)
    },
    async archiveComment() {
      // TODO
      try {
        await this.$apollo.mutate({
          mutation: gql`
            mutation commentArchival($streamId: String!, $commentId: String!) {
              commentArchival(streamId: $streamId, commentId: $commentId)
            }
          `,
          variables: {
            streamId: this.$route.params.streamId,
            commentId: this.comment.id
          }
        })
        this.replyText = null
        this.showArchiveDialog = false
        this.$emit('deleted', this.comment)
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
.no-mouse {
  pointer-events: none;
}
.mouse {
  pointer-events: auto;
}
</style>
