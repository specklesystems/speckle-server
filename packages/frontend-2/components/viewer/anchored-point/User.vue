<template>
  <div
    :class="[
      'absolute pointer-events-auto',
      user.isStale ? 'opacity-20 hover:opacity-100' : 'opacity-100'
    ]"
    :style="{
      ...user.style.target
    }"
  >
    <IconCursor
      :class="`fill-primary ${
        user.isOccluded && spotlightUserSessionId !== user.sessionId ? 'grayscale' : ''
      }`"
    />
    <button
      :class="`relative left-5 -top-0 py-0 px-2 rounded ${
        user.isOccluded && spotlightUserSessionId !== user.sessionId ? 'grayscale' : ''
      } ${spotlightUserSessionId === user.sessionId ? 'border-2 border-rose-500' : ''}
      bg-primary text-foreground-on-primary hover:bg-primary-focus hover:text-foreground-on-primary transition select-none flex items-center h-6`"
      @click="() => setUserSpotlight()"
    >
      <span class="text-xs space-x-1">
        <span>{{ user.userName }}</span>
        <span v-if="isCreatingNewThread">is typing{{ ellipsis }}</span>
      </span>
    </button>
  </div>
</template>
<script setup lang="ts">
import { useMixpanel } from '~~/lib/core/composables/mp'
import type { UserActivityModel } from '~~/lib/viewer/composables/activity'
import { useAnimatingEllipsis } from '~~/lib/viewer/composables/commentBubbles'
import { useInjectedViewerInterfaceState } from '~~/lib/viewer/composables/setup'

const { spotlightUserSessionId } = useInjectedViewerInterfaceState()
const { ellipsis, controls } = useAnimatingEllipsis()

const props = defineProps<{
  user: UserActivityModel
}>()

const isCreatingNewThread = computed(
  () =>
    props.user.state.ui.threads.openThread.isTyping &&
    !props.user.state.ui.threads.openThread.threadId
)

const mp = useMixpanel()
function setUserSpotlight() {
  if (spotlightUserSessionId.value === props.user.sessionId) {
    spotlightUserSessionId.value = null
    mp.track('Viewer Action', {
      type: 'action',
      name: 'spotlight-mode',
      action: 'stop',
      source: 'cursor'
    })
    return
  }
  spotlightUserSessionId.value = props.user.sessionId || null
  mp.track('Viewer Action', {
    type: 'action',
    name: 'spotlight-mode',
    action: 'start',
    source: 'cursor'
  })
}

watch(isCreatingNewThread, (isCreating) => {
  if (isCreating) {
    controls.resume()
  } else {
    controls.pause()
  }
})
</script>
