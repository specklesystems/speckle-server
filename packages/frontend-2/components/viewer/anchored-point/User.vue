<template>
  <div
    :class="[
      'absolute p-1 pointer-events-auto flex space-x-1 pl-2 pr-4 py-2 rounded-tl-full rounded-tr-full rounded-br-full text-xs shadow-lg',
      user.isStale ? 'bg-foundation-disabled' : 'bg-foundation'
    ]"
    :style="{
      ...user.style.target
    }"
  >
    <UserIcon class="h-4 w-4" />
    <span>{{ user.userName }}</span>
  </div>
</template>
<script setup lang="ts">
import { UserActivityModel } from '~~/lib/viewer/composables/activity'
import { UserCircleIcon, UserIcon } from '@heroicons/vue/24/solid'

defineProps<{
  user: UserActivityModel
}>()
</script>
