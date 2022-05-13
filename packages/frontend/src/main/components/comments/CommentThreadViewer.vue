<template>
  <div
    class="no-mouse pa-2"
    :style="`${
      $vuetify.breakpoint.xs ? 'width: 90vw;' : 'width: 300px;'
    } xxx-background: rgba(0.5, 0.5, 0.5, 0.5)`"
  >
    <div v-if="$vuetify.breakpoint.xs" class="text-right mb-5 mouse">
      <v-btn
        icon
        small
        class="background ml-2 elevation-10"
        @click="minimize = !minimize"
      >
        <v-icon v-if="!minimize" small>mdi-minus</v-icon>
        <v-icon v-else small>mdi-plus</v-icon>
      </v-btn>
      <v-btn
        icon
        small
        class="primary dark white--text ml-2 elevation-10"
        @click="$emit('close', comment)"
      >
        <v-icon small>mdi-close</v-icon>
      </v-btn>
    </div>
    <div v-show="!minimize" style="width: 100%" class="mouse">
      <div
        v-if="!isComplete"
        class="warning rounded-xl py-2 caption mb-2 text-center"
        dense
      >
        <v-icon x-small>mdi-alert-circle-outline</v-icon>
        This comment is targeting other resources.
        <v-btn x-small @click="addMissingResources()">View in full context</v-btn>
      </div>
      <div v-show="$apollo.loading" class="px-2">
        <v-progress-linear indeterminate />
      </div>
      <template v-for="(reply, index) in thread">
        <div
          v-if="showTime(index)"
          :key="index + 'date'"
          class="d-flex justify-center mouse"
        >
          <div
            class="d-inline px-2 py-0 caption text-center mb-2 rounded-lg background grey--text"
          >
            {{ new Date(reply.createdAt).toLocaleString() }}
            <timeago :datetime="reply.createdAt" class="font-italic ma-1"></timeago>
          </div>
        </div>
        <comment-thread-reply
          :key="index + 'reply'"
          :reply="reply"
          :stream="stream"
          :index="index"
          @deleted="handleReplyDeleteEvent"
        />
      </template>
      <div v-if="$loggedIn()" class="px-0 mb-4">
        <v-slide-y-transition>
          <div
            v-show="whoIsTyping.length > 0"
            class="px-4 py-2 caption mb-2 background rounded-xl"
          >
            {{ typingStatusText }}
          </div>
        </v-slide-y-transition>
        <div v-if="canReply">
          <v-textarea
            v-model="replyText"
            :disabled="loadingReply"
            solo
            hide-details
            auto-grow
            rows="1"
            placeholder="Reply (press enter to send)"
            class="rounded-xl mb-2 caption"
            append-icon="mdi-send"
            @input="debTypingUpdate"
            @click:append="addReply"
            @keydown.enter.exact.prevent="addReply()"
          ></v-textarea>
        </div>
        <div v-else class="caption background rounded-xl py-2 px-4 elevation-2">
          You do not have sufficient permissions to reply to comments in this stream.
        </div>
        <div v-show="loadingReply" class="px-2">
          <v-progress-linear indeterminate />
        </div>
        <div ref="replyinput" class="text-right">
          <v-btn
            v-show="canArchiveThread"
            v-tooltip="'Marks this thread as archived.'"
            class="white--text mt-2 mr-2"
            small
            icon
            depressed
            color="error"
            @click="showArchiveDialog = true"
          >
            <v-icon small>mdi-delete-outline</v-icon>
          </v-btn>
          <v-btn
            v-tooltip="'Share this comment as a link!'"
            class="white--text mt-2 mr-2 rounded-xl elevation-4"
            small
            depressed
            color="primary"
            @click="copyCommentLinkToClip()"
          >
            <v-icon small class="mr-2">mdi-share-variant</v-icon>
            share
          </v-btn>
        </div>
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
      </div>
      <div v-else>
        <v-btn
          block
          depressed
          color="primary"
          class="rounded-xl"
          @click="$loginAndSetRedirect()"
        >
          <v-icon small class="mr-1">mdi-account</v-icon>
          Sign in to reply
        </v-btn>
      </div>
    </div>
  </div>
</template>
<script>
import gql from 'graphql-tag'
import debounce from 'lodash/debounce'

export default {
  components: {
    CommentThreadReply: () => import('@/main/components/comments/CommentThreadReply')
  },
  props: {
    comment: { type: Object, default: () => null }
  },
  apollo: {
    user: {
      query: gql`
        query {
          user {
            name
            id
          }
        }
      `,
      skip() {
        return !this.$loggedIn()
      }
    },
    stream: {
      query: gql`
        query ($streamId: String!) {
          stream(id: $streamId) {
            id
            role
            allowPublicComments
          }
        }
      `,
      variables() {
        return { streamId: this.$route.params.streamId }
      }
    },
    replyQuery: {
      query: gql`
        query ($streamId: String!, $id: String!) {
          comment(streamId: $streamId, id: $id) {
            id
            viewedAt
            archived
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
      fetchPolicy: 'cache-and-network',
      variables() {
        return {
          streamId: this.$route.params.streamId,
          id: this.comment.id
        }
      },
      result({ data }) {
        if (!data) return
        data.comment.replies.items.forEach((item) => {
          if (this.localReplies.findIndex((c) => c.id === item.id) === -1)
            this.localReplies.push(item)
        })
        // this.localReplies.push(...data.comment.replies.items)
      },
      update: (data) => data.comment
    },
    $subscribe: {
      commentThreadActivity: {
        query: gql`
          subscription ($streamId: String!, $commentId: String!) {
            commentThreadActivity(streamId: $streamId, commentId: $commentId)
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
          if (data.commentThreadActivity.eventType === 'reply-added') {
            if (!this.comment.expanded) return this.$emit('bounce', this.comment.id)
            else {
              setTimeout(() => {
                this.$emit('refresh-layout') // needed for layout reshuffle in parent
              }, 100)
            }
            this.localReplies.push({ ...data.commentThreadActivity })
            this.$refs.replyinput.scrollIntoView({ behaviour: 'smooth', block: 'end' })
            return
          }
          if (data.commentThreadActivity.eventType === 'comment-archived') {
            this.$emit('deleted', this.comment)
          }
          if (data.commentThreadActivity.eventType === 'reply-typing-status') {
            const state = data.commentThreadActivity.data
            if (state.userId === this.$userId()) return
            const existingUser = this.whoIsTyping.find((u) => u.userId === state.userId)
            if (state.isTyping && existingUser) {
              existingUser.lastSeenAt = Date.now()
              return
            }
            if (!state.isTyping) {
              const indx = this.whoIsTyping.findIndex((u) => u.userId === state.userId)
              if (indx !== -1) this.whoIsTyping.splice(indx, 1)
              return
            }
            if (state.isTyping && !existingUser) {
              state.lastSeenAt = Date.now()
              this.whoIsTyping.push(state)
            }
          }
        }
      }
    }
  },
  data() {
    return {
      replyText: null,
      localReplies: [],
      minimize: false,
      showArchiveDialog: false,
      loadingReply: false,
      whoIsTyping: [],
      isTyping: true
    }
  },
  computed: {
    canReply() {
      return !!this.stream?.role || this.stream?.allowPublicComments
    },
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
    thread() {
      const sorted = [...this.localReplies].sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      )
      return [this.comment, ...sorted]
    },
    isComplete() {
      const res = [this.$route.params.resourceId]
      if (this.$route.query.overlay) res.push(...this.$route.query.overlay.split(','))
      const commRes = this.comment.resources
        .filter((r) => r.resourceType !== 'stream')
        .map((r) => r.resourceId)

      for (const r of commRes) {
        if (res.indexOf(r) === -1) return false
      }
      return true
    },
    link() {
      if (!this.comment) return
      const res = this.comment.resources.filter((r) => r.resourceType !== 'stream')
      const first = res.shift()
      let route = `/streams/${this.$route.params.streamId}/${first.resourceType}s/${first.resourceId}?cId=${this.comment.id}`
      if (res.length !== 0) {
        route += `&overlay=${res.map((r) => r.resourceId).join(',')}`
      }
      return route
    },
    typingStatusText() {
      if (this.whoIsTyping.length === 0) return null
      if (this.whoIsTyping.length > 1) {
        return `${this.whoIsTyping.map((u) => u.userName).join(', ')} are typing...`
      } else {
        return `${this.whoIsTyping[0].userName} is typing...`
      }
    }
  },
  watch: {
    'comment.expanded': {
      deep: true,
      async handler(newVal) {
        if (!this.$loggedIn() || !this.canReply) return

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

        // eslint-disable-next-line vue/no-mutating-props
        this.comment.viewedAt = Date.now()
        if (!newVal) return
        this.localReplies = []
        this.$apollo.queries.replyQuery.refetch()
        this.$mixpanel.track('Comment Action', { type: 'action', name: 'open' })
      }
    }
  },
  mounted() {
    window.addEventListener('beforeunload', async () => {
      await this.sendTypingUpdate(false)
    })
    setInterval(() => {
      const now = Date.now()
      for (let i = this.whoIsTyping.length - 1; i >= 0; i--) {
        if (Math.abs(now - this.whoIsTyping[i].lastSeenAt) > 10000)
          this.whoIsTyping.splice(i, 1)
      }
    }, 5000)
  },
  methods: {
    debTypingUpdate: debounce(
      async function () {
        if (!this.$loggedIn()) return
        await this.sendTypingUpdate(this.isTyping)
        this.isTyping = !this.isTyping
      },
      7000,
      { leading: true }
    ),

    async sendTypingUpdate(state = true) {
      if (!this.$loggedIn()) return
      await this.$apollo.mutate({
        mutation: gql`
          mutation typingUpdate($sId: String!, $cId: String!, $d: JSONObject) {
            userCommentThreadActivityBroadcast(
              streamId: $sId
              commentId: $cId
              data: $d
            )
          }
        `,
        variables: {
          sId: this.$route.params.streamId,
          cId: this.comment.id,
          d: {
            userId: this.$userId(),
            userName: this.user.name,
            isTyping: state
          }
        }
      })
    },
    copyCommentLinkToClip() {
      const res = this.comment.resources.filter((r) => r.resourceType !== 'stream')
      const first = res.shift()
      let route = `${window.origin}/streams/${this.$route.params.streamId}/${first.resourceType}s/${first.resourceId}?cId=${this.comment.id}`
      if (res.length !== 0) {
        route += `&overlay=${res.map((r) => r.resourceId).join(',')}`
      }
      navigator.clipboard.writeText(route)
      this.$mixpanel.track('Comment Action', { type: 'action', name: 'share' })
      this.$eventHub.$emit('notification', {
        text: 'Comment link copied to clipboard - paste away!'
      })
    },
    addMissingResources() {
      const res = [this.$route.params.resourceId]
      if (this.$route.query.overlay) res.push(...this.$route.query.overlay.split(','))
      const commRes = this.comment.resources
        .filter((r) => r.resourceType !== 'stream')
        .map((r) => r.resourceId)

      const missing = []
      for (const r of commRes) {
        if (res.indexOf(r) === -1) missing.push(r)
      }
      this.$emit('add-resources', missing)
    },
    showTime(index) {
      if (index === 0) return true
      const curr = new Date(this.thread[index].createdAt)
      const prev = new Date(this.thread[index - 1].createdAt)
      const delta = Math.abs(prev - curr)
      return delta > 450000
    },
    async addReply() {
      if (!this.replyText || this.replyText.length < 1) {
        this.$eventHub.$emit('notification', {
          text: `Cannot post an empty reply.`
        })
        return
      }

      const replyInput = {
        streamId: this.$route.params.streamId,
        parentComment: this.comment.id,
        text: this.replyText
      }

      this.loadingReply = true

      try {
        this.replyText = null
        await this.$apollo.mutate({
          mutation: gql`
            mutation commentReply($input: ReplyCreateInput!) {
              commentReply(input: $input)
            }
          `,
          variables: { input: replyInput }
        })
        await this.sendTypingUpdate(false)
        this.$mixpanel.track('Comment Action', { type: 'action', name: 'reply' })
      } catch (e) {
        this.$eventHub.$emit('notification', {
          text: e.message
        })
      }

      this.loadingReply = false

      setTimeout(() => {
        // Shhh.
        // eslint-disable-next-line vue/no-mutating-props
        this.comment.replies.totalCount++
        // eslint-disable-next-line vue/no-mutating-props
        this.comment.updatedAt = Date.now()
        this.$emit('refresh-layout') // needed for layout reshuffle in parent
      }, 100)
    },
    handleReplyDeleteEvent(id) {
      if (this.comment.id === id) {
        this.$emit('deleted', this.comment)
        return
      }
      const idx = this.localReplies.findIndex((r) => r.id === id)
      this.localReplies.splice(idx, 1)
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
        this.replyText = null
        this.showArchiveDialog = false
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
.no-mouse {
  pointer-events: none;
}
.mouse {
  pointer-events: auto;
}
</style>
