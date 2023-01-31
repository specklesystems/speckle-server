<template>
  <div
    :class="[
      'absolute p-2 pointer-events-auto flex flex-col',
      user.isStale ? 'bg-foundation-disabled' : 'bg-foundation'
    ]"
    :style="{
      ...user.style.target
    }"
  >
    <span>{{ user.userName }}</span>
  </div>
</template>
<script setup lang="ts">
import { UserActivityModel } from '~~/lib/viewer/composables/activity'

defineProps<{
  user: UserActivityModel
}>()
</script>
