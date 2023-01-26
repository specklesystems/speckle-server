<template>
  <div
    ref="parentEl"
    class="absolute w-full h-full pointer-events-none overflow-hidden"
  >
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
import { Nullable } from '@speckle/shared'
import { useViewerUserActivityTracking } from '~~/lib/viewer/composables/activity'

const parentEl = ref(null as Nullable<HTMLElement>)
const { users } = useViewerUserActivityTracking({ parentEl })
</script>
