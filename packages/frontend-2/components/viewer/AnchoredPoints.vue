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
      :key="user.state.sessionId"
      :user="user"
      class="z-[10]"
    />

    <!-- Active user avatars in navbar -->
    <Portal to="secondary-actions">
      <ViewerScope :state="state">
        <div
          v-show="activeUserAvatars.length > 0"
          class="px-1 py-1 flex space-x-1 items-center"
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

    <!-- Active user tracking cancel & Follower count display -->
    <div
      v-if="(spotlightUserId && spotlightUser) || followers.length !== 0"
      class="absolute w-screen mt-[3.5rem] h-[calc(100vh-3.5rem)] z-10 p-1"
    >
      <div
        class="w-full h-full outline -outline-offset-0 outline-8 rounded-md outline-blue-500/40"
      >
        <div class="absolute bottom-4 right-4 p-2 pointer-events-auto">
          <FormButton
            v-if="spotlightUserId && spotlightUser"
            size="xs"
            class="truncate"
            @click="() => (spotlightUserId = null)"
          >
            <span>Stop Following {{ spotlightUser?.userName.split(' ')[0] }}</span>
          </FormButton>
          <div
            v-else
            v-tippy="followers.map((u) => u.name).join(', ')"
            class="text-xs p-2 font-bold text-primary"
          >
            Followed by {{ followers[0].name.split(' ')[0] }}
            <span v-if="followers.length > 1">
              & {{ followers.length - 1 }}
              {{ followers.length - 1 === 1 ? 'other' : 'others' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { Nullable } from '@speckle/shared'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { LimitedUser } from '~~/lib/common/generated/gql/graphql'
import { isNonNullable } from '~~/lib/common/helpers/utils'

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
const { activeUser, isLoggedIn } = useActiveUser()
const { users } = useViewerUserActivityTracking({ parentEl })

const followers = computed(() => {
  if (!isLoggedIn.value) return []
  const res = [] as LimitedUser[]
  // users.value['test'].state.ui.spotlightUserId
  Object.values(users.value).forEach((model) => {
    if (model.state.ui.spotlightUserId === activeUser.value?.id)
      res.push(model.user as LimitedUser)
  })
  return res
})

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

const activeUserAvatars = computed(() =>
  Object.values(users.value)
    .map((u) => u.user)
    .filter(isNonNullable)
)
const spotlightUser = computed(() => {
  return Object.values(users.value).find((u) => u.userId === spotlightUserId.value)
})

function setUserSpotlight(userId: string) {
  if (spotlightUserId.value === userId) return (spotlightUserId.value = null)
  spotlightUserId.value = userId
}
</script>
