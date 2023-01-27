<template>
  <div
    ref="parentEl"
    class="absolute w-full h-full pointer-events-none overflow-hidden"
  >
    <!-- Add new thread bubble -->
    <div
      v-show="buttonState.isVisible"
      class="absolute pointer-events-auto"
      :style="{
        ...buttonState.style,
        transformOrigin: 'center'
      }"
    >
      <FormButton :icon-left="PlusIcon" hide-text />
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
  </div>
</template>
<script setup lang="ts">
import { PlusIcon } from '@heroicons/vue/24/solid'
import { Nullable } from '@speckle/shared'
import { useViewerUserActivityTracking } from '~~/lib/viewer/composables/activity'
import {
  useViewerCommentBubbles,
  useViewerNewThreadBubble
} from '~~/lib/viewer/composables/commentBubbles'

const parentEl = ref(null as Nullable<HTMLElement>)
const { users } = useViewerUserActivityTracking({ parentEl })
const { commentThreads } = useViewerCommentBubbles({ parentEl })
const { buttonState } = useViewerNewThreadBubble({ parentEl })
</script>
