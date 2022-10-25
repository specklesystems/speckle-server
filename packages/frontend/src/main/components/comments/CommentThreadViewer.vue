<template>
  <div
    v-if="!$vuetify.breakpoint.xs || (isEmbed && commentSlideShow)"
    class="no-mouse py-2"
    :style="`max-width: 350px; padding-right:30px;
    ${
      hovered ? 'opacity: 1;' : 'opacity: 1;'
    } transition: opacity 0.2s ease; padding-left: 6px;`"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
  >
    <div style="width: 100%" class="mouse d-block">
      <div v-if="!isComplete" class="mb-2 mr-5" dense>
        <v-btn
          v-tooltip="
            'This comment is attached to extra commits or objects. Click here to load them.'
          "
          small
          rounded
          block
          class="warning"
          @click="addMissingResources()"
        >
          <v-icon small class="mr-2">mdi-target</v-icon>
          Load full context
        </v-btn>
      </div>
      <div v-show="$apollo.loading" class="px-2 mb-2">
        <v-progress-linear indeterminate />
      </div>
      <template v-for="(reply, index) in thread">
        <div
          v-if="showTime(index) && !commentSlideShow"
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
      <template v-if="!isEmbed">
        <div v-if="$loggedIn()" class="px-0 mb-4">
          <v-slide-y-transition>
            <div
              v-show="whoIsTyping.length > 0"
              class="px-4 py-2 caption mb-2 background rounded-xl"
            >
              {{ typingStatusText }}
            </div>
          </v-slide-y-transition>
          <div v-if="canReply" class="d-flex mr-2">
            <comment-editor
              ref="commentEditor"
              v-model="replyValue"
              :stream-id="streamId"
              adding-comment
              max-height="300px"
              class="mb-2"
              :style="{ width: $vuetify.breakpoint.xs ? '100%' : '290px' }"
              :disabled="loadingReply"
              @input="debTypingUpdate"
              @attachments-processing="anyAttachmentsProcessing = $event"
              @submit="addReply()"
            />
          </div>
          <div v-else class="caption background rounded-xl py-2 px-4 mr-4 elevation-2">
            You do not have sufficient permissions to reply to comments in this stream.
          </div>
          <div v-show="loadingReply" class="px-2 mb-2">
            <v-progress-linear indeterminate />
          </div>
          <div
            v-if="canReply"
            ref="replyinput"
            class="d-flex justify-space-between align-center comment-actions"
          >
            <v-btn
              v-show="canArchiveThread"
              v-tooltip="'Marks this thread as archived.'"
              class="white--text ml-2"
              small
              icon
              depressed
              color="error"
              @click="showArchiveDialog = true"
            >
              <v-icon small>mdi-delete-outline</v-icon>
            </v-btn>
            <div class="pr-5">
              <v-btn
                v-tooltip="'Copy comment url to clipboard'"
                :disabled="loadingReply"
                class="mouse elevation-5 background mr-3"
                icon
                large
                @click="copyCommentLinkToClip()"
              >
                <v-icon dark small>mdi-share-variant</v-icon>
              </v-btn>
              <v-btn
                v-tooltip="'Add attachments'"
                :disabled="loadingReply"
                icon
                large
                class="mouse elevation-5 background mr-3"
                @click="addAttachments()"
              >
                <v-icon v-if="$vuetify.breakpoint.smAndDown" small>mdi-camera</v-icon>
                <v-icon v-else small>mdi-paperclip</v-icon>
              </v-btn>
              <v-btn
                v-tooltip="'Send comment (press enter)'"
                :disabled="isSubmitDisabled"
                class="mouse elevation-5 primary"
                icon
                dark
                large
                @click="addReply()"
              >
                <v-icon dark small>mdi-send</v-icon>
              </v-btn>
            </div>
          </div>
        </div>
        <div v-else class="pr-5">
          <v-btn
            block
            depressed
            color="primary"
            rounded
            class="elevation-5"
            large
            @click="$loginAndSetRedirect()"
          >
            <v-icon small class="mr-1">mdi-account</v-icon>
            Sign in to reply
          </v-btn>
        </div>
      </template>
      <template v-else-if="!commentSlideShow">
        <div class="pr-5">
          <v-btn
            small
            color="primary"
            block
            rounded
            :href="getCommentLink()"
            target="_blank"
          >
            reply in speckle
            <v-icon small>mdi-arrow-top-right</v-icon>
          </v-btn>
        </div>
      </template>
      <template v-if="isEmbed && commentSlideShow">
        <div class="d-flex align-center justify-center pr-5 text-right">
          <v-btn
            icon
            class="primary elevation-1 mr-2"
            small
            @click="$emit('next', comment, -1)"
          >
            <v-icon small class="white--text">mdi-chevron-left</v-icon>
          </v-btn>
          <v-btn
            rounded
            color="primary"
            class="elevation-5 px-5"
            @click="$emit('next', comment, 1)"
          >
            <span class="caption">next</span>
            <v-icon small>mdi-chevron-right</v-icon>
          </v-btn>
        </div>
      </template>
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
  <!--
    Note: portaling out the mobile view of comment threads because of
    stacking chaos caused by transforms, etc. in positioning from the default
    view.
  -->
  <div v-else-if="comment.expanded">
    <portal to="mobile-comment-thread">
      <div
        :class="`mobile-thread mouse background ${
          mobileExpanded ? 'expanded' : ''
        } simple-scrollbar`"
        style="overflow-y: auto"
      >
        <v-card class="elevation-0" style="height: 100vh">
          <v-toolbar
            style="position: sticky; top: 0; z-index: 1000"
            @click.stop="mobileExpanded = !mobileExpanded"
          >
            <v-btn
              v-if="$loggedIn() && canReply && !isEmbed"
              v-tooltip="'Add attachments'"
              :disabled="loadingReply"
              icon
              large
              class="mouse elevation-5 background"
              @click.stop="addAttachments()"
            >
              <v-icon v-if="$vuetify.breakpoint.smAndDown" small>
                mdi-camera-plus
              </v-icon>
              <v-icon v-else small>mdi-paperclip</v-icon>
            </v-btn>
            <v-app-bar-nav-icon class="ml-0 pl-0">
              <v-icon v-if="!mobileExpanded">mdi-chevron-up</v-icon>
              <v-icon v-else>mdi-chevron-down</v-icon>
            </v-app-bar-nav-icon>
            <v-toolbar-title>
              {{ localReplies.length }}
              {{ localReplies.length !== 1 ? 'replies' : 'reply' }}
            </v-toolbar-title>
            <v-spacer />
            <v-btn icon @click.stop="timeoutClose()">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-toolbar>
          <!--
            I know, this is bad copy paste. Sigh. Currently, one can only wish for a better world
            with less technical debt.
          -->
          <div
            style="width: 100%"
            class="mouse d-block mt-4 mb-4 pl-4"
            @click.stop="expandMobileIfNotExpandedAlready()"
          >
            <div v-if="!isComplete" class="mb-2 mr-5" dense>
              <v-btn
                v-tooltip="
                  'This comment is attached to extra commits or objects. Click here to load them.'
                "
                small
                rounded
                block
                class="warning"
                @click="addMissingResources()"
              >
                <v-icon small class="mr-2">mdi-target</v-icon>
                Load full context
              </v-btn>
            </div>
            <div v-show="$apollo.loading" class="px-2 mb-2">
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
                  <timeago
                    :datetime="reply.createdAt"
                    class="font-italic ma-1"
                  ></timeago>
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
            <template v-if="!isEmbed">
              <div v-if="$loggedIn()" class="px-0 mb-4">
                <v-slide-y-transition>
                  <div
                    v-show="whoIsTyping.length > 0"
                    class="px-4 py-2 caption mb-2 background rounded-xl"
                  >
                    {{ typingStatusText }}
                  </div>
                </v-slide-y-transition>
                <div v-if="canReply" class="d-flex pr-5">
                  <comment-editor
                    ref="commentEditor"
                    v-model="replyValue"
                    :stream-id="streamId"
                    :autofocus="false"
                    adding-comment
                    max-height="300px"
                    class="mb-2"
                    :style="{ width: $vuetify.breakpoint.xs ? '100%' : '290px' }"
                    :disabled="loadingReply"
                    @input="debTypingUpdate"
                    @attachments-processing="anyAttachmentsProcessing = $event"
                    @submit="addReply()"
                  />
                </div>
                <div
                  v-else
                  class="caption background rounded-xl py-2 px-4 mr-4 elevation-2"
                >
                  You do not have sufficient permissions to reply to comments in this
                  stream.
                </div>
                <div v-show="loadingReply" class="px-2 mb-2">
                  <v-progress-linear indeterminate />
                </div>
                <div
                  v-if="canReply"
                  ref="replyinput"
                  class="pb-10 mb-10 d-flex justify-space-between align-center comment-actions"
                >
                  <v-btn
                    v-show="canArchiveThread"
                    v-tooltip="'Marks this thread as archived.'"
                    class="white--text ml-2"
                    small
                    icon
                    depressed
                    color="error"
                    @click="showArchiveDialog = true"
                  >
                    <v-icon small>mdi-delete-outline</v-icon>
                  </v-btn>
                  <div class="pr-5">
                    <v-btn
                      v-tooltip="'Copy comment url to clipboard'"
                      :disabled="loadingReply"
                      class="mouse elevation-5 background mr-3"
                      icon
                      large
                      @click="copyCommentLinkToClip()"
                    >
                      <v-icon dark small>mdi-share-variant</v-icon>
                    </v-btn>
                    <v-btn
                      v-tooltip="'Add attachments'"
                      :disabled="loadingReply"
                      icon
                      large
                      class="mouse elevation-5 background mr-3"
                      @click.stop="addAttachments()"
                    >
                      <v-icon v-if="$vuetify.breakpoint.smAndDown" small>
                        mdi-camera-plus
                      </v-icon>
                      <v-icon v-else small>mdi-paperclip</v-icon>
                    </v-btn>
                    <v-btn
                      v-tooltip="'Send comment (press enter)'"
                      :disabled="isSubmitDisabled"
                      class="mouse elevation-5 primary"
                      icon
                      dark
                      large
                      @click="addReply()"
                    >
                      <v-icon dark small>mdi-send</v-icon>
                    </v-btn>
                  </div>
                </div>
              </div>
              <div v-else class="pr-5">
                <v-btn
                  block
                  depressed
                  color="primary"
                  rounded
                  class="elevation-5"
                  large
                  @click="$loginAndSetRedirect()"
                >
                  <v-icon small class="mr-1">mdi-account</v-icon>
                  Sign in to reply
                </v-btn>
              </div>
            </template>
          </div>
        </v-card>
      </div>
    </portal>
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
</template>
<script>
import { gql } from '@apollo/client/core'
import debounce from 'lodash/debounce'
import { onKeyStroke } from '@vueuse/core'

import CommentThreadReply from '@/main/components/comments/CommentThreadReply.vue'
import CommentEditor from '@/main/components/comments/CommentEditor.vue'
import { isDocEmpty } from '@/main/lib/common/text-editor/documentHelper'
import { SMART_EDITOR_SCHEMA } from '@/main/lib/viewer/comments/commentsHelper'
import { isSuccessfullyUploaded } from '@/main/lib/common/file-upload/fileUploadHelper'
import { COMMENT_FULL_INFO_FRAGMENT } from '@/graphql/comments'
import { useCommitObjectViewerParams } from '@/main/lib/viewer/commit-object-viewer/stateManager'
import { useEmbedViewerQuery } from '@/main/lib/viewer/commit-object-viewer/composables/embed'
// TODO: The template is a WET mess, need to refactor it

export default {
  components: {
    CommentThreadReply,
    CommentEditor
  },
  props: {
    comment: { type: Object, default: () => null }
  },
  apollo: {
    user: {
      query: gql`
        query {
          activeUser {
            name
            id
          }
        }
      `,
      update: (data) => data.activeUser,
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
        return { streamId: this.streamId }
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
                ...CommentFullInfo
              }
            }
          }
        }
        ${COMMENT_FULL_INFO_FRAGMENT}
      `,
      fetchPolicy: 'cache-and-network',
      variables() {
        return {
          streamId: this.streamId,
          id: this.comment.id
        }
      },
      result({ data }) {
        if (!data) return
        data.comment.replies.items.forEach((item) => {
          if (this.localReplies.findIndex((c) => c.id === item.id) === -1)
            this.localReplies.push(item)
        })
      },
      update: (data) => data.comment
    },
    $subscribe: {
      commentThreadActivity: {
        query: gql`
          subscription ($streamId: String!, $commentId: String!) {
            commentThreadActivity(streamId: $streamId, commentId: $commentId) {
              type
              data
              reply {
                ...CommentFullInfo
              }
            }
          }
          ${COMMENT_FULL_INFO_FRAGMENT}
        `,
        variables() {
          return {
            streamId: this.streamId,
            commentId: this.comment.id
          }
        },
        skip() {
          return !this.$loggedIn()
        },
        result({ data }) {
          if (!data || !data.commentThreadActivity) return
          if (data.commentThreadActivity.type === 'reply-added') {
            if (!this.comment.expanded) return this.$emit('bounce', this.comment.id)
            else {
              setTimeout(() => {
                this.$emit('refresh-layout') // needed for layout reshuffle in parent
              }, 100)
            }
            this.localReplies.push(data.commentThreadActivity.reply)
            this.$refs.replyinput?.scrollIntoView({ behaviour: 'smooth', block: 'end' })
            return
          }
          if (data.commentThreadActivity.type === 'comment-archived') {
            this.$emit('deleted', this.comment)
          }
          if (data.commentThreadActivity.type === 'reply-typing-status') {
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
  setup() {
    const { streamId, resourceId, isEmbed } = useCommitObjectViewerParams()
    const { commentSlideShow } = useEmbedViewerQuery()
    return {
      streamId,
      resourceId,
      isEmbed,
      commentSlideShow
    }
  },
  data() {
    return {
      hovered: true,
      replyValue: { doc: null, attachments: [] },
      localReplies: [],
      minimize: false,
      showArchiveDialog: false,
      loadingReply: false,
      whoIsTyping: [],
      isTyping: true,
      editorSchemaOptions: SMART_EDITOR_SCHEMA,
      anyAttachmentsProcessing: false,
      mobileExpanded: false,
      mobileFullyClosing: false
    }
  },
  computed: {
    isSubmitDisabled() {
      return this.loadingReply || this.anyAttachmentsProcessing
    },
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
      const res = [this.resourceId]
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
      let route = `/streams/${this.streamId}/${first.resourceType}s/${first.resourceId}?cId=${this.comment.id}`
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
        this.hovered = true
        await this.$apollo.mutate({
          mutation: gql`
            mutation commentView($streamId: String!, $commentId: String!) {
              commentView(streamId: $streamId, commentId: $commentId)
            }
          `,
          variables: {
            streamId: this.streamId,
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
    this.mobileExpanded = false
    window.addEventListener('beforeunload', async () => {
      await this.sendTypingUpdate(false)
    })

    onKeyStroke('Escape', () => {
      this.$emit('close', this.comment)
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
    timeoutClose() {
      if (this.mobileExpanded) {
        this.mobileExpanded = false
        setTimeout(() => {
          this.$emit('close', this.comment)
        }, 200)
      } else {
        this.$emit('close', this.comment)
      }
    },
    expandMobileIfNotExpandedAlready() {
      if (this.mobileExpanded) return
      this.mobileExpanded = true
    },
    debTypingUpdate: debounce(
      async function () {
        if (!this.$loggedIn()) return
        await this.sendTypingUpdate(this.isTyping)
        this.isTyping = !this.isTyping
      },
      7000,
      { leading: true }
    ),
    addAttachments() {
      this.$refs.commentEditor.addAttachments()
    },
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
          sId: this.streamId,
          cId: this.comment.id,
          d: {
            userId: this.$userId(),
            userName: this.user.name,
            isTyping: state
          }
        }
      })
    },
    getCommentLink() {
      const res = this.comment.resources.filter((r) => r.resourceType !== 'stream')
      const first = res.shift()
      let route = `${window.origin}/streams/${this.streamId}/${first.resourceType}s/${first.resourceId}?cId=${this.comment.id}`
      if (res.length !== 0) {
        route += `&overlay=${res.map((r) => r.resourceId).join(',')}`
      }
      return route
    },
    copyCommentLinkToClip() {
      const route = this.getCommentLink()
      navigator.clipboard.writeText(route)
      this.$mixpanel.track('Comment Action', { type: 'action', name: 'share' })
      this.$eventHub.$emit('notification', {
        text: 'Comment link copied to clipboard - paste away!'
      })
    },
    addMissingResources() {
      const res = [this.resourceId]
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
    isReplyEmpty() {
      return isDocEmpty(this.replyValue.doc) && !this.replyValue.attachments.length
    },
    async addReply() {
      if (this.isReplyEmpty()) {
        this.$eventHub.$emit('notification', {
          text: `Cannot post an empty reply.`
        })
        return
      }

      const blobIds = this.replyValue.attachments
        .filter(isSuccessfullyUploaded)
        .map((a) => a.result.blobId)
      const replyInput = {
        streamId: this.streamId,
        parentComment: this.comment.id,
        text: this.replyValue.doc,
        blobIds
      }

      let success = false
      this.loadingReply = true
      try {
        const { data } = await this.$apollo.mutate({
          mutation: gql`
            mutation commentReply($input: ReplyCreateInput!) {
              commentReply(input: $input)
            }
          `,
          variables: { input: replyInput }
        })
        success = !!data.commentReply
        await this.sendTypingUpdate(false)
        this.$mixpanel.track('Comment Action', { type: 'action', name: 'reply' })
      } catch (e) {
        this.$eventHub.$emit('notification', {
          text: e.message
        })
      }

      // On success, mark uploads as in use, to prevent cleanup
      if (success) {
        this.replyValue.attachments.forEach((a) => {
          a.inUse = true
        })
      }

      this.loadingReply = false
      this.replyValue = { doc: null, attachments: [] }

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
            streamId: this.streamId,
            commentId: this.comment.id
          }
        })
        this.replyValue = { doc: null, attachments: [] }
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

.mobile-thread {
  transition: all 0.2s ease;
  z-index: 30;
  position: fixed;
  top: 80%;
  left: 0;
  width: 100vw;
  height: 100vh;
}

.mobile-thread.expanded {
  top: 0;
  left: 0;
}
</style>
