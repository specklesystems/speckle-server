<template>
  <div class="shrink-0 w-8 h-8 rounded-full border-2 border-outline-1 overflow-hidden">
    <img v-if="avatarUrl" class="w-full h-full" :src="avatarUrl" alt="User avatar" />
    <UserCircleIcon class="w-full h-full scale-150" />
  </div>
</template>
<script setup lang="ts">
import { UserCircleIcon } from '@heroicons/vue/24/solid'

defineProps<{
  avatarUrl?: string | null
}>()
</script>
