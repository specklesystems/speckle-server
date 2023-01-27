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
      :model-value="thread"
      class="z-[11]"
      @update:model-value="onThreadUpdate"
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
  CommentBubbleModel,
  useViewerCommentBubbles,
  useViewerNewThreadBubble
} from '~~/lib/viewer/composables/commentBubbles'

const parentEl = ref(null as Nullable<HTMLElement>)
const { users } = useViewerUserActivityTracking({ parentEl })
const { commentThreads, openThread } = useViewerCommentBubbles({ parentEl })
const { buttonState } = useViewerNewThreadBubble({
  parentEl,
  block: computed(() => !!openThread.value)
})

const onThreadUpdate = (thread: CommentBubbleModel) => {
  // Being careful not to mutate old value directly to ensure watchers work properly
  commentThreads.value = {
    ...commentThreads.value,
    [thread.id]: thread
  }
}
</script>
