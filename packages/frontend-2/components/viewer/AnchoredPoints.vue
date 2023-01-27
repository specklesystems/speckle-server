<template>
  <div
    ref="parentEl"
    class="absolute w-full h-full pointer-events-none overflow-hidden"
  >
    <!-- Add new thread bubble -->
    <ViewerAnchoredPointNewThread v-model="buttonState" class="z-[12]" />

    <!-- Comment bubbles -->
    <ViewerAnchoredPointThread
      v-for="thread in Object.values(commentThreads)"
      :key="thread.id"
      :thread="thread"
      class="z-[11]"
    />

    <!-- Active user -->
    <ViewerAnchoredPointUser
      v-for="user in Object.values(users)"
      :key="user.viewerSessionId"
      :user="user"
      class="z-[10]"
    />
  </div>
</template>
<script setup lang="ts">
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
