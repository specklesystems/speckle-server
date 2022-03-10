<template>
  <div class="mt-2 pa-1 d-flex align-center" style="width: 300px">
    <div class="" style="width: 100%">
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
          v-tooltip="'Marks this thread as resolved.'"
          class="float-right"
          x-small
          rounded
          depressed
          color="error"
        >
          Archive
        </v-btn>
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
          this.localReplies.push({ ...data.commentReplyCreated })
        }
      }
    }
  },
  data: function () {
    return {
      replyText: null,
      localReplies: []
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
        // resources: [{ resourceId: this.$route.params.streamId, resourceType: 'stream' }],
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
