<template>
  <div class="transition text-foreground hover:text-primary-focus">
    <NuxtLink
      :to="to"
      class="flex items-center text-sm"
      active-class="text-primary font-bold"
    >
      <div v-if="separator">
        <ChevronRightIcon class="flex w-4 h-4 mt-[3px] mx-0 md:mx-1" />
      </div>
      <div class="max-w-[120px] md:max-w-[200px] lg:max-w-[300px] truncate">
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
