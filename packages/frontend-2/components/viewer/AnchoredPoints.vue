<template>
  <div
    ref="parentEl"
    class="absolute w-full h-full pointer-events-none overflow-hidden"
  >
    <!-- Active user -->
    <div
      v-for="user in Object.values(users)"
      :key="user.viewerSessionId"
      :class="[
        'absolute p-2 pointer-events-auto flex flex-col',
        user.isStale ? 'bg-foundation-disabled' : 'bg-foundation'
      ]"
      :style="{
        ...user.style.target,
        transformOrigin: 'center'
      }"
    >
      <span>{{ user.userName }}</span>
    </div>

    <!-- Comment bubbles -->
    <div
      v-for="thread in Object.values(commentThreads)"
      :key="thread.id"
      :class="'absolute p-2 pointer-events-auto flex flex-col bg-foundation rounded-lg'"
      :style="{
        ...thread.style,
        transformOrigin: 'center'
      }"
    >
      {{ thread.rawText.substring(0, 5) + '...' }}
    </div>
  </div>
</template>
<script setup lang="ts">
import { Nullable } from '@speckle/shared'
import { useViewerUserActivityTracking } from '~~/lib/viewer/composables/activity'
import { useViewerCommentBubbles } from '~~/lib/viewer/composables/commentBubbles'

const parentEl = ref(null as Nullable<HTMLElement>)
const { users } = useViewerUserActivityTracking({ parentEl })
const { commentThreads } = useViewerCommentBubbles({ parentEl })
</script>
