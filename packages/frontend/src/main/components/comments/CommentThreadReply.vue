<template>
  <div>
    <div
      v-if="!link"
      :class="`d-flex px-2 py-1 mb-2 align-center rounded-xl elevation-2 ${
        $userId() === reply.authorId ? 'primary white--text' : 'background'
      }`"
    >
      <div
        :class="`d-inline-block ${$userId() === reply.authorId ? 'order-last' : ''}`"
      >
        <user-avatar :id="reply.authorId" :size="30" />
      </div>
      <div
        :class="`reply-box d-inline-block mx-2 px-4 py-2 flex-grow-1 float-left caption`"
      >
        {{ reply.text }}
      </div>
    </div>
    <div v-else :class="`d-flex px-2 py-1 mb-2 align-center`">
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
  </div>
</template>
<script>
export default {
  components: {
    UserAvatar: () => import('@/main/components/common/UserAvatar')
  },
  props: {
    reply: { type: Object, default: () => null },
    stream: { type: Object, default: () => null }
  },
  data() {
    return {}
  },
  computed: {
    link() {
      if (!this.reply) return false
      try {
        const url = new URL(this.reply.text)
        return url
      } catch {
        return null
      }
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
