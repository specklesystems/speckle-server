<template>
  <div class="flex items-center">
    <div v-if="separator">
      <MinusIcon class="sm:hidden w-5 h-5" />
      <ChevronRightIcon class="text-foreground hidden sm:flex w-5 h-5" />
    </div>
    <div>
      <NuxtLink
        :to="to"
        class="px-3 py-1 h6 font-bold rounded-full transition hover:bg-primary-muted text-foreground hover:text-primary"
        active-class="bg-primary-muted text-primary-focus"
      >
        {{ name || to }}
      </NuxtLink>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ChevronRightIcon, MinusIcon } from '@heroicons/vue/20/solid'
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
