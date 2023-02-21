<template>
  <div
    :class="[
      'absolute pointer-events-auto flex',
      user.isStale ? 'xxxbg-foundation-disabled' : 'xxxbg-foundation'
    ]"
    :style="{
      ...user.style.target
    }"
  >
    <UserIcon class="h-4 w-4" />
    <span>{{ user.userName }}</span>
    <!-- <IconCursor class="w-4 h-4"/> -->
  </div>
</template>
<script setup lang="ts">
import { UserActivityModel } from '~~/lib/viewer/composables/activity'
import { UserCircleIcon, UserIcon } from '@heroicons/vue/24/solid'

defineProps<{
  user: UserActivityModel
}>()
</script>
