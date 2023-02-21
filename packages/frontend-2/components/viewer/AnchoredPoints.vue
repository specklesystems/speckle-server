<template>
  <div
    ref="parentEl"
    class="absolute w-full h-full pointer-events-none overflow-hidden"
  >
    <!-- Add new thread bubble -->
    <ViewerAnchoredPointNewThread
      v-model="buttonState"
      class="z-[13]"
      @close="closeNewThread"
    />

    <!-- Comment bubbles -->
    <ViewerAnchoredPointThread
      v-for="thread in Object.values(commentThreads)"
      :key="thread.id"
      :model-value="thread"
      :class="openThread?.id === thread.id ? 'z-[12]' : 'z-[11]'"
      @update:model-value="onThreadUpdate"
      @update:expanded="onThreadExpandedChange"
    />

    <!-- Active users -->
    <ViewerAnchoredPointUser
      v-for="user in Object.values(users)"
      :key="user.viewerSessionId"
      :user="user"
      class="z-[10]"
    />

    <!-- Active user avatars in navbar -->
    <Portal to="secondary-actions">
      <ViewerScope :state="state">
        <div
          v-show="activeUserAvatars.length > 0"
          class="rounded-xl mr-2 px-1 py-1 border-1 border-primary flex space-x-1 items-center"
        >
          <!-- <span class="text-xs text-foreground-2 mr-2 flex items-center">
            <EyeIcon class="w-3 h-3 fill-foreground-2 mr-1" />
            {{ activeUserAvatars.length }}
          </span> -->
          <UserAvatarGroup :users="activeUserAvatars" size="sm" :overlap="false" />
        </div>
      </ViewerScope>
    </Portal>
  </div>
</template>
<script setup lang="ts">
import { Nullable } from '@speckle/shared'
import { EyeIcon } from '@heroicons/vue/24/solid'
import { useViewerUserActivityTracking } from '~~/lib/viewer/composables/activity'
import {
  CommentBubbleModel,
  useViewerCommentBubbles,
  useViewerNewThreadBubble
} from '~~/lib/viewer/composables/commentBubbles'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'

const parentEl = ref(null as Nullable<HTMLElement>)
const { users } = useViewerUserActivityTracking({ parentEl })
const { commentThreads, openThread } = useViewerCommentBubbles({ parentEl })
const { buttonState, closeNewThread } = useViewerNewThreadBubble({
  parentEl
})

const state = useInjectedViewerState()

const onThreadUpdate = (thread: CommentBubbleModel) => {
  // Being careful not to mutate old value directly to ensure watchers work properly
  commentThreads.value = {
    ...commentThreads.value,
    [thread.id]: thread
  }
}

const onThreadExpandedChange = (isExpanded: boolean) => {
  if (isExpanded) {
    closeNewThread()
  }
}

const activeUserAvatars = computed(() => Object.values(users.value).map((u) => u.user))
</script>
