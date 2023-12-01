<template>
  <div class="overflow-x-auto text-foreground hover:text-primary-focus transition">
    <NuxtLink
      :to="to"
      class="flex gap-1 items-center text-sm ml-0.5"
      active-class="text-primary font-bold"
    >
      <div v-if="separator">
        <ChevronRightIcon class="flex w-4 h-4" />
      </div>
      <div class="truncate">
        {{ name || to }}
      </div>
    </NuxtLink>
  </div>
</template>
<script setup lang="ts">
import { ChevronRightIcon } from '@heroicons/vue/20/solid'
defineProps({
  separator: {
    type: Boolean,
    default: true
  },
  to: {
    type: String,
    default: '/'
  },
  name: {
    type: String,
    default: null
  }
})
</script>
