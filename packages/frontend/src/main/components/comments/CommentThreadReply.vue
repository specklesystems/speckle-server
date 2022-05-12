<template>
  <div
    :class="`d-inline-block px-2 py-1 mb-2 align-center rounded-xl elevation-2 ${
      $userId() === reply.authorId ? 'primary white--text' : 'background'
    }`"
    style="max-width: 100%; width: 100%"
  >
    <div :class="`d-inline-block ${$userId() === reply.authorId ? 'order-last' : ''}`">
      <user-avatar :id="reply.authorId" :size="30" />
    </div>
    <div :class="`d-inline-block mx-2 px-4 py-2 flex-grow-1 float-left caption`">
      {{ reply.text }}
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
  }
}
</script>
