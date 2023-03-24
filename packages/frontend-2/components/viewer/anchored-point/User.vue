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
        user.isOccluded && spotlightUserId !== user.userId ? 'grayscale' : ''
      }`"
    />
    <button
      :class="`relative left-5 -top-0 py-0 px-2 rounded ${
        user.isOccluded && spotlightUserId !== user.userId ? 'grayscale' : ''
      } ${spotlightUserId === user.userId ? 'border-2 border-rose-500' : ''}
      bg-primary text-foreground-on-primary hover:bg-primary-focus hover:text-foreground-on-primary transition select-none flex items-center h-6`"
      @click="() => setUserSpotlight()"
    >
      <span class="text-xs space-x-1">
        <span>{{ user.userName }}</span>
        <span v-if="isCreatingNewThread">is typing...</span>
      </span>
    </button>
  </div>
</template>
<script setup lang="ts">
import { UserActivityModel } from '~~/lib/viewer/composables/activity'
import { useInjectedViewerInterfaceState } from '~~/lib/viewer/composables/setup'

const { spotlightUserId } = useInjectedViewerInterfaceState()

const props = defineProps<{
  user: UserActivityModel
}>()

const isCreatingNewThread = computed(
  () => props.user.thread?.isTyping && !props.user.thread.threadId
)

function setUserSpotlight() {
  if (spotlightUserId.value === props.user.userId) return (spotlightUserId.value = null)
  spotlightUserId.value = props.user.userId
}
</script>
