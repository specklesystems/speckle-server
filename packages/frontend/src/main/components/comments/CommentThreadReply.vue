<template>
  <!-- eslint-disable vue/no-v-html -->
  <div
    class="d-flex align-center comment-thread-reply"
    :class="
      isUserOwned ? 'comment-thread-reply--author' : 'comment-thread-reply--visitor'
    "
    @mouseenter="hover = true"
    @mouseleave="hover = false"
  >
    <div
      :class="`comment-thread-reply__inner flex-grow-1 d-flex flex-column px-2 py-1 mb-2 rounded-xl elevation-2`"
      style="width: 290px"
    >
      <div class="d-flex">
        <div :class="`d-inline-block`">
          <user-avatar :id="reply.authorId" :size="30" />
        </div>
        <div
          :class="`reply-box d-inline-block mx-2 py-2 flex-grow-1 float-left caption`"
        >
          <smart-text-editor
            v-if="reply.text.doc"
            min-width
            read-only
            :schema-options="richTextSchema"
            :value="reply.text.doc"
          />
          <comment-thread-reply-attachments
            v-if="reply.text.attachments && reply.text.attachments.length"
            :attachments="reply.text.attachments"
            :primary="isUserOwned"
          />
        </div>
      </div>
    </div>
    <div style="width: 20px; overflow: hidden; position: relative; top: -5px">
      <v-scroll-x-transition>
        <v-btn
          v-show="hover && canArchive"
          v-tooltip="'Archive'"
          x-small
          icon
          class="ml-1"
          @click="showArchiveDialog = true"
        >
          <v-icon small>mdi-delete</v-icon>
        </v-btn>
      </v-scroll-x-transition>
    </div>
    <v-dialog v-model="showArchiveDialog" max-width="500">
      <v-card>
        <v-toolbar color="error" dark flat>
          <v-app-bar-nav-icon style="pointer-events: none">
            <v-icon>mdi-pencil</v-icon>
          </v-app-bar-nav-icon>
          <v-toolbar-title>
            Archive Comment {{ index === 0 ? 'Thread' : '' }}
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="showArchiveDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        <v-card-text class="mt-4">
          This comment {{ index === 0 ? 'thread, including all replies, ' : '' }} will
          be archived. Are you sure?
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
import SmartTextEditor from '@/main/components/common/text-editor/SmartTextEditor.vue'
import { SMART_EDITOR_SCHEMA } from '@/main/lib/viewer/comments/commentsHelper'
import CommentThreadReplyAttachments from '@/main/components/comments/CommentThreadReplyAttachments.vue'
import { useCommitObjectViewerParams } from '@/main/lib/viewer/commit-object-viewer/stateManager'
import { useIsLoggedIn } from '@/main/lib/core/composables/core'
import { computed } from 'vue'

export default {
  components: {
    UserAvatar: () => import('@/main/components/common/UserAvatar'),
    SmartTextEditor,
    CommentThreadReplyAttachments
  },
  props: {
    reply: { type: Object, default: () => null },
    stream: { type: Object, default: () => null },
    index: { type: Number, default: 0 }
  },
  setup(props) {
    const { streamId, resourceId, isEmbed } = useCommitObjectViewerParams()
    const { userId } = useIsLoggedIn()
    const isUserOwned = computed(
      () => !!(userId.value && userId.value === props.reply?.authorId)
    )

    return { streamId, resourceId, isEmbed, isUserOwned }
  },
  data() {
    return {
      hover: false,
      showArchiveDialog: false,
      richTextSchema: SMART_EDITOR_SCHEMA
    }
  },
  computed: {
    canArchive() {
      if (this.isEmbed) return false
      if (!this.reply || !this.stream) return false
      if (this.stream.role === 'stream:owner' || this.isUserOwned) return true
      return false
    }
  },
  methods: {
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
            commentId: this.reply.id
          }
        })
        this.$emit('deleted', this.reply.id)
        this.$mixpanel.track('Comment Action', { type: 'action', name: 'archive' })
        this.$eventHub.$emit('notification', {
          text: this.index === 0 ? 'Thread archived.' : 'Comment archived.'
        })
      } catch (e) {
        this.$eventHub.$emit('notification', {
          text: e.message
        })
      }
      this.showArchiveDialog = false
    }
  }
}
</script>
<style lang="scss">
// Theme-specific coloring
.comment-thread-reply {
  $base: &;

  // Active user's reply
  &.comment-thread-reply--author {
    & > #{$base}__inner {
      background-color: var(--v-primary-base);
      border-color: var(--v-primary-base);

      &,
      a {
        color: #ffffff;
      }
    }
  }

  // Guest's reply
  &.comment-thread-reply--visitor {
    & > #{$base}__inner {
      background-color: var(--v-background-base);
      border-color: var(--v-background-base);

      &,
      a {
        color: var(--v-text-base);
      }
    }
  }
}
.smart-text-editor,
.comment-attachments {
  a {
    font-weight: bold;
    text-decoration: none;
    word-break: break-all;
  }
}

.smart-text-editor {
  a:after {
    content: ' ↗ ';
  }
}
</style>
