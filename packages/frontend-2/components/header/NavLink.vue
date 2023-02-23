<template>
  <div class="flex items-center">
    <div v-if="separator">
      <ChevronRightIcon class="text-foreground hidden sm:flex w-5 h-5 mt-[1px] mx-1" />
    </div>
    <div>
      <NuxtLink
        :to="to"
        class="text-sm rounded-full transition text-foreground hover:text-primary-focus"
        active-class="text-primary font-bold"
      >
        {{ name || to }}
      </NuxtLink>
    </div>
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
