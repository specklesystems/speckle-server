<template>
  <div
    ref="parentEl"
    class="absolute w-full h-full pointer-events-none overflow-hidden"
  >
    <!-- Add new thread bubble -->
    <ViewerAnchoredPointNewThread
      v-if="shouldShowNewThread"
      v-model="buttonState"
      :can-post-comment="canPostComment"
      class="z-[13]"
      @close="closeNewThread"
      @login="showLoginDialog = true"
    />

    <!-- Comment bubbles -->
    <ViewerAnchoredPointThread
      v-for="thread in Object.values(commentThreads)"
      v-show="!hideBubbles || isOpenThread(thread.id)"
      :key="thread.id"
      :model-value="thread"
      :class="openThread?.id === thread.id ? 'z-[12]' : 'z-[11]'"
      :has-previous="
        allThreadsChronologicalOrder.findIndex((t) => t.id === thread.id) > 0
      "
      :has-next="
        allThreadsChronologicalOrder.findIndex((t) => t.id === thread.id) <
        allThreadsChronologicalOrder.length - 1
      "
      @update:model-value="onThreadUpdate"
      @update:expanded="onThreadExpandedChange"
      @next="(model) => openNextThread(model)"
      @prev="(model) => openPrevThread(model)"
      @login="showLoginDialog = true"
    />

    <ViewerContextMenu v-model:open="contextMenuOpen" :parent-el="parentEl" />

    <div v-if="!isEmbedEnabled">
      <!-- Active users -->
      <ViewerAnchoredPointUser
        v-for="user in visibleUsers"
        :key="user.state.sessionId"
        :user="user"
        class="z-[10]"
      />
    </div>

    <AuthLoginPanel
      v-model:open="showLoginDialog"
      dialog-mode
      max-width="sm"
      subtitle="Join the conversation"
    />

    <!-- Active user avatars in navbar -->
    <Portal to="secondary-actions">
      <ViewerScope :state="state">
        <div
          v-if="usersWithAvatars.length > 0"
          class="scale-90 flex space-x-1 items-center"
        >
          <!-- <UserAvatarGroup :users="activeUserAvatars" :overlap="false" hover-effect /> -->
          <template v-for="user in usersWithAvatars" :key="user.id">
            <button @click="setUserSpotlight(user.sessionId)">
              <UserAvatar
                v-tippy="
                  `${
                    user.sessionId === spotlightUserSessionId
                      ? 'Stop following'
                      : 'Follow'
                  } ${user.user.name}`
                "
                :user="user.user"
                hover-effect
                hide-tooltip
                :active="user.sessionId === spotlightUserSessionId"
              />
            </button>
          </template>
        </div>
      </ViewerScope>
    </Portal>

    <!-- Active user tracking cancel & Follower count display -->
    <div
      v-if="showFollowerMessage"
      class="absolute w-screen z-10 p-1 h-[calc(100dvh-3rem)]"
      :class="isEmbedEnabled ? '' : 'mt-[3rem]'"
    >
      <div class="absolute top-0 left-0 w-full justify-center flex">
        <div
          class="pointer-events-auto bg-primary text-white text-xs px-3 h-8 flex items-center rounded-b-md cursor-default"
        >
          <div v-if="spotlightUserSessionId && spotlightUser">
            Following {{ spotlightUser?.userName.split(' ')[0] }}
            <FormButton
              color="outline"
              size="sm"
              class="ml-1 -mr-1.5"
              @click="() => (spotlightUserSessionId = null)"
            >
              <span>Stop</span>
            </FormButton>
          </div>
          <div
            v-else-if="followers.length > 0"
            v-tippy="{ placement: 'bottom' }"
            :content="followers.map((u) => u.name).join(', ')"
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

    <!-- Shows up when filters are applied for an easy return to normality -->
    <div
      class="z-20 absolute left-1/2 -translate-x-1/2"
      :class="showFollowerMessage ? 'top-24' : 'top-14'"
    >
      <ViewerGlobalFilterReset v-if="hasAnyFiltersApplied" />
      <ViewerGlobalIsolationHiddenReset
        v-else-if="hasAnyIsolationsApplied || hasAnyHiddenApplied"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import type { Nullable } from '@speckle/shared'
import { useEmbed } from '~/lib/viewer/composables/setup/embed'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import type { LimitedUser } from '~~/lib/common/generated/gql/graphql'
import type { SetFullyRequired } from '~~/lib/common/helpers/type'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { useViewerUserActivityTracking } from '~~/lib/viewer/composables/activity'
import {
  useViewerCommentBubblesProjection,
  useViewerNewThreadBubble
} from '~~/lib/viewer/composables/commentBubbles'
import type { CommentBubbleModel } from '~~/lib/viewer/composables/commentBubbles'
import { useCheckViewerCommentingAccess } from '~~/lib/viewer/composables/commentManagement'
import {
  useInjectedViewerInterfaceState,
  useInjectedViewerState
} from '~~/lib/viewer/composables/setup'
import { useThreadUtilities } from '~~/lib/viewer/composables/ui'
import { useFilterUtilities } from '~/lib/viewer/composables/filtering/filtering'
import { TailwindBreakpoints } from '~~/lib/common/helpers/tailwind'
import { useBreakpoints } from '@vueuse/core'

const emit = defineEmits<{
  forceClosePanels: []
}>()

const parentEl = ref(null as Nullable<HTMLElement>)
const { isLoggedIn } = useActiveUser()
const viewerState = useInjectedViewerState()
const { sessionId } = viewerState
const { users } = useViewerUserActivityTracking({ anchoredPointsParentEl: parentEl })
const { isOpenThread, open, closeAllThreads } = useThreadUtilities()
const {
  filters: { hasAnyFiltersApplied },
  hasAnyIsolationsApplied,
  hasAnyHiddenApplied
} = useFilterUtilities({ state: viewerState })
const canPostComment = useCheckViewerCommentingAccess()
const breakpoints = useBreakpoints(TailwindBreakpoints)
const isMobile = breakpoints.smaller('sm')

const { isEnabled: isEmbedEnabled } = useEmbed()

const followers = computed(() => {
  if (!isLoggedIn.value) return []
  const res = [] as LimitedUser[]
  Object.values(users.value).forEach((model) => {
    if (model.state.ui.spotlightUserSessionId === sessionId.value)
      res.push(model.user as LimitedUser)
  })
  return res
})

const {
  spotlightUserSessionId,
  threads: {
    openThread: { thread: openThread },
    items: commentThreads,
    hideBubbles
  }
} = useInjectedViewerInterfaceState()

const showLoginDialog = ref(false)
const contextMenuOpen = ref(false)

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
    contextMenuOpen.value = false
  }
}

const shouldShowNewThread = computed(
  () =>
    !isEmbedEnabled.value && !state.ui.measurement.enabled.value && canPostComment.value
)

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

const usersWithAvatars = computed(() =>
  Object.values(users.value).filter(
    (u): u is SetFullyRequired<typeof u, 'user'> => !!u.user
  )
)

const visibleUsers = computed(() =>
  // Hide users who are following someone else
  Object.values(users.value).filter((user) => !user.state.ui.spotlightUserSessionId)
)

const spotlightUser = computed(() => {
  return Object.values(users.value).find(
    (u) => u.sessionId === spotlightUserSessionId.value
  )
})

const showFollowerMessage = computed(
  () =>
    (!isEmbedEnabled.value && spotlightUserSessionId.value && spotlightUser.value) ||
    followers.value.length !== 0
)

const mp = useMixpanel()
function setUserSpotlight(sessionId: string) {
  if (spotlightUserSessionId.value === sessionId) {
    spotlightUserSessionId.value = null
    mp.track('Viewer Action', {
      type: 'action',
      name: 'spotlight-mode',
      action: 'stop',
      source: 'navbar'
    })
    return
  }

  spotlightUserSessionId.value = sessionId
  mp.track('Viewer Action', {
    type: 'action',
    name: 'spotlight-mode',
    action: 'start',
    source: 'navbar'
  })
}

const forceCloseThreads = async () => {
  await closeAllThreads()
}

// Watch for thread opening on mobile and emit event
watch(
  () => openThread.value,
  (newThread, oldThread) => {
    // If a thread opened (wasn't open before) on mobile, emit event
    if (newThread && !oldThread && isMobile.value) {
      emit('forceClosePanels')
    }
  }
)

watch(
  () => contextMenuOpen.value,
  (isOpen) => {
    if (isOpen) {
      closeNewThread()
    }
  }
)

defineExpose({
  forceCloseThreads
})
</script>
