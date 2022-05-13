<template>
  <div class="" @mouseenter="hover = true" @mouseleave="hover = false">
    <div
      v-if="!link"
      :class="`flex-grow-1 d-flex px-2 py-1 mb-2 align-center rounded-xl elevation-2 ${
        $userId() === reply.authorId ? 'primary white--text' : 'background'
      }`"
    >
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
      <div
        :class="`d-inline-block ${$userId() === reply.authorId ? 'order-last' : ''}`"
      >
        <user-avatar :id="reply.authorId" :size="30" />
      </div>
      <div :class="`reply-box d-inline-block mx-2 py-2 flex-grow-1 float-left caption`">
        {{ reply.text }}
        <!-- <br />
        {{ canArchive }} -->
      </div>
    </div>
    <div v-else :class="`flex-grow-1 d-flex px-2 py-1 mb-2 align-center`">
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
      <div
        :class="`d-inline-block ${$userId() === reply.authorId ? 'order-last' : ''}`"
      >
        <user-avatar :id="reply.authorId" :size="30" />
      </div>
      <div
        :class="`reply-box d-inline-block py-2 flex-grow-1 float-left caption ${
          $userId() === reply.authorId ? 'pr-3' : 'pl-1'
        }`"
      >
        <div class="d-block">
          <v-btn
            v-tooltip="reply.text"
            block
            rounded
            :href="reply.text"
            target="_blank"
            :class="`reply-box overflow-hidden ${
              $userId() === reply.authorId ? 'primary white--text' : 'background'
            }`"
          >
            <span class="caption">
              {{ link.host.substring(0, 18) }} {{ link.host.length > 20 ? '...' : '' }}
            </span>
            <v-icon small class="ml-2">mdi-open-in-new</v-icon>
          </v-btn>
        </div>
      </div>
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
import gql from 'graphql-tag'
export default {
  components: {
    UserAvatar: () => import('@/main/components/common/UserAvatar')
  },
  props: {
    reply: { type: Object, default: () => null },
    stream: { type: Object, default: () => null },
    index: { type: Number, default: 0 }
  },
  data() {
    return {
      hover: false,
      showArchiveDialog: false
    }
  },
  computed: {
    canArchive() {
      if (!this.reply || !this.stream) return false
      if (this.stream.role === 'stream:owner' || this.reply.authorId === this.$userId())
        return true
      return false
    },
    link() {
      if (!this.reply) return false
      try {
        const url = new URL(this.reply.text)
        return url
      } catch {
        return null
      }
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
            streamId: this.$route.params.streamId,
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
<style scoped>
.reply-box {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
