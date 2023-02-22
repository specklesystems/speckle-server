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
          <!-- <UserAvatarGroup :users="activeUserAvatars" :overlap="false" hover-effect /> -->
          <UserAvatar
            v-for="user in activeUserAvatars"
            :key="user.id"
            :user="user"
            hover-effect
          />
        </div>
      </ViewerScope>
    </Portal>
    <div
      v-if="spotlightUserId"
      class="absolute w-screen mt-[3.5rem] h-[calc(100vh-3.5rem)] z-10 p-1"
    >
      <div class="w-full h-full border-2 border-blue-500/50 rounded-xl">
        <div class="absolute bottom-4 right-4 p-2 pointer-events-auto">
          <FormButton size="sm" class="" @click="spotlightUserId = null">
            Stop Following {{ spotlightUser?.userName }}
          </FormButton>
        </div>
      </div>
    </div>
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
import {
  useInjectedViewerInterfaceState,
  useInjectedViewerState
} from '~~/lib/viewer/composables/setup'

const parentEl = ref(null as Nullable<HTMLElement>)
const { users } = useViewerUserActivityTracking({ parentEl })
const { spotlightUserId } = useInjectedViewerInterfaceState()

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
const spotlightUser = computed(() => {
  return Object.values(users.value).find((u) => u.userId === spotlightUserId.value)
})
</script>
