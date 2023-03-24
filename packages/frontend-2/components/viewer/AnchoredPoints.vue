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
      v-show="!hideBubbles || thread.isExpanded"
      :key="thread.id"
      :model-value="thread"
      :class="openThread?.id === thread.id ? 'z-[12]' : 'z-[11]'"
      @update:model-value="onThreadUpdate"
      @update:expanded="onThreadExpandedChange"
      @next="(model) => openNextThread(model)"
      @prev="(model) => openPrevThread(model)"
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
          <template v-for="user in activeUserAvatars" :key="user.id">
            <button @click="setUserSpotlight(user.id)">
              <UserAvatar
                v-tippy="
                  `${user.id === spotlightUserId ? 'Stop Following' : 'Follow'} ${
                    user.name
                  }`
                "
                :user="user"
                hover-effect
                :active="user.id === spotlightUserId"
              />
            </button>
          </template>
        </div>
      </ViewerScope>
    </Portal>

    <!-- Active user tracking cancel -->
    <div
      v-if="spotlightUserId && spotlightUser"
      class="absolute w-screen mt-[3.5rem] h-[calc(100vh-3.5rem)] z-10 p-1"
    >
      <div class="w-full h-full border-4 border-blue-500/50 rounded-xl">
        <div class="absolute bottom-4 right-4 p-2 pointer-events-auto">
          <FormButton
            size="sm"
            class="group w-36 truncate"
            @click="() => (spotlightUserId = null)"
          >
            <span class="hidden group-hover:inline-block">Stop Following</span>
            <span class="inline-block group-hover:hidden truncate">
              {{ spotlightUser?.userName }}
            </span>
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
  useViewerCommentBubblesProjection,
  useViewerNewThreadBubble
} from '~~/lib/viewer/composables/commentBubbles'
import {
  useInjectedViewerInterfaceState,
  useInjectedViewerState
} from '~~/lib/viewer/composables/setup'

const parentEl = ref(null as Nullable<HTMLElement>)
const { users } = useViewerUserActivityTracking({ parentEl })
const {
  spotlightUserId,
  threads: {
    openThread: { thread: openThread },
    items: commentThreads,
    hideBubbles,
    open
  }
} = useInjectedViewerInterfaceState()

useViewerCommentBubblesProjection({ parentEl })

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

const allThreadsChronologicalOrder = computed(() => {
  const vals = Object.values(commentThreads.value)
  return vals.sort(
    (a, b) => new Date(b.createdAt).getUTCDate() - new Date(a.createdAt).getUTCDate()
  )
})

const openNextThread = (currentThread: CommentBubbleModel) => {
  const threadCount = allThreadsChronologicalOrder.value.length
  let currentThreadIndex = allThreadsChronologicalOrder.value.findIndex(
    (t) => currentThread.id === t.id
  )
  if (++currentThreadIndex > threadCount - 1) currentThreadIndex = 0
  const nextThread = allThreadsChronologicalOrder.value[currentThreadIndex]
  if (!nextThread) return

  open(nextThread.id)
}

const openPrevThread = (currentThread: CommentBubbleModel) => {
  const threadCount = allThreadsChronologicalOrder.value.length
  let currentThreadIndex = allThreadsChronologicalOrder.value.findIndex(
    (t) => currentThread.id === t.id
  )
  if (--currentThreadIndex < 0) currentThreadIndex = threadCount - 1
  const nextThread = allThreadsChronologicalOrder.value[currentThreadIndex]
  if (!nextThread) return

  open(nextThread.id)
}

const activeUserAvatars = computed(() => Object.values(users.value).map((u) => u.user))
const spotlightUser = computed(() => {
  return Object.values(users.value).find((u) => u.userId === spotlightUserId.value)
})

function setUserSpotlight(userId: string) {
  if (spotlightUserId.value === userId) return (spotlightUserId.value = null)
  spotlightUserId.value = userId
}
</script>
